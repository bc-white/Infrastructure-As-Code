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
    }
    backend "s3" {
        encrypt = true
        region  = "us-east-1"
        bucket  = lower("irad-terraform-state-${random_string.suffix.result}")
        key     = "tf-state"
        dynamodb_table = "tf_locks"
        profile = "IRAD-Admin"
    }
}

provider "aws" {
    region = "us-east-1"
    profile = "IRAD-Admin"
    default_tags {
        tags = {
        Environment = "prod"
        "Terrafom" = "true"
        "Account" = "IRAD"
        }
    }
}

resource "random_string" "suffix" {
    length  = 4
    special = false
}

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
    source                               = "terraform-aws-modules/s3-bucket/aws"
    version                              = ">= 4.6.0"
    bucket                               = lower("irad-terraform-state-${random_string.suffix.result}")
    block_public_acls                    = true
    block_public_policy                  = true
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
    public_subnet_tags   = {
        "kubernetes.io/role/elb" = 1
    }
    private_subnet_tags  = {
        "kubernetes.io/role/internal-elb" = 1
    }
}

module "eks" {
    source                                   = "terraform-aws-modules/eks/aws"
    version                                  = "~> 20.31"
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
        ami_type = "AL2_x86_64"
    }
    eks_managed_node_groups = {
        one = {
            name = "node-group-1"
            instance_types = ["t3.small"]
            min_size     = 1
            max_size     = 3
            desired_size = 2
        }
        two = {
            name = "node-group-2"
            instance_types = ["t3.small"]
            min_size     = 1
            max_size     = 3
            desired_size = 1
        }
    }
}

data "aws_iam_policy" "ebs_csi_policy" {
    arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

module "irsa-ebs-csi" {
    source                       = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
    version                      = "5.39.0"
    create_role                   = true
    role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
    provider_url                  = module.eks.oidc_provider
    role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
    oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
}