terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.60.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.35"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.15"
    }
  }
  backend "s3" {
    encrypt        = true
    region         = "us-east-1"
    bucket         = "irad-terraform-state-rsh0"
    key            = "tf-state"
    dynamodb_table = "tf_locks"
    profile        = "IRAD-Admin"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "IRAD-Admin"
  default_tags {
    tags = {
      Environment = "prod"
      "Terraform" = "true"
      "Account"   = "IRAD"
    }
  }
}
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--profile", "IRAD-Admin"]
  }
}
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--profile", "IRAD-Admin"]
    }
  }
}

resource "random_string" "suffix" {
  length  = 4
  special = false
}

data "aws_region" "current_region" {}
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available_zones" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "tf_locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}

module "tf_state_bucket" {
  source              = "terraform-aws-modules/s3-bucket/aws"
  version             = ">= 4.6.0"
  bucket              = lower("irad-terraform-state-${random_string.suffix.result}")
  block_public_acls   = true
  block_public_policy = true
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
}

module "vpc" {
  source               = "terraform-aws-modules/vpc/aws"
  name                 = "irad-eks-vpc"
  cidr                 = "10.1.0.0/16"
  azs                  = slice(data.aws_availability_zones.available_zones.names, 0, 3)
  private_subnets      = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  public_subnets       = ["10.1.4.0/24", "10.1.5.0/24", "10.1.6.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"
  cluster_addons = {
    aws-ebs-csi-driver = {
      service_account_role_arn = module.irsa-ebs-csi.iam_role_arn
    }
  }
  cluster_name                             = "irad-eks-cluster-${random_string.suffix.result}"
  cluster_version                          = "1.32"
  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true
  vpc_id                                   = module.vpc.vpc_id
  subnet_ids                               = module.vpc.private_subnets
  eks_managed_node_group_defaults = {
    ami_type = "AL2023_x86_64_STANDARD"
  }
  eks_managed_node_groups = {
    one = {
      name           = "node-group-1"
      instance_types = ["m7i-flex.large"]
      min_size       = 1
      max_size       = 3
      desired_size   = 2
    }
    two = {
      name           = "node-group-2"
      instance_types = ["m7i-flex.large"]
      min_size       = 1
      max_size       = 3
      desired_size   = 1
    }
  }
}

data "aws_iam_policy" "ebs_csi_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

module "irsa-ebs-csi" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version                       = "5.39.0"
  create_role                   = true
  role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
}

# Default StorageClass for EBS volumes
resource "kubernetes_storage_class" "ebs_gp3" {
  metadata {
    name = "ebs-gp3"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }
  storage_provisioner    = "ebs.csi.aws.com"
  reclaim_policy         = "Delete"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true
  parameters = {
    type      = "gp3"
    encrypted = "true"
    fsType    = "ext4"
  }
  depends_on = [module.eks]
}

# AWS Load Balancer Controller IAM Role
module "aws_load_balancer_controller_irsa_role" {
  source                                 = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version                                = "5.39.0"
  role_name                              = "aws-load-balancer-controller-${module.eks.cluster_name}"
  attach_load_balancer_controller_policy = false
  role_policy_arns = {
    aws_load_balancer_controller = aws_iam_policy.aws_load_balancer_controller.arn
  }
  oidc_providers = {
    ex = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
  tags = {
    Name = "aws-load-balancer-controller-irsa-role"
  }
}

# Install AWS Load Balancer Controller using Helm
resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.11.0"
  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }
  set {
    name  = "serviceAccount.create"
    value = "true"
  }
  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.aws_load_balancer_controller_irsa_role.iam_role_arn
  }
  set {
    name  = "region"
    value = data.aws_region.current_region.name
  }
  set {
    name  = "vpcId"
    value = module.vpc.vpc_id
  }
  depends_on = [
    module.eks,
    module.aws_load_balancer_controller_irsa_role
  ]
}
