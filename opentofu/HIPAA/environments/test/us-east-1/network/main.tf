module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr
  azs             = local.azs
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
  public_subnet_tags = {
    Type = "public"
  }
  private_subnet_tags = {
    Type = "private"
  }
  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

resource "aws_vpc_endpoint" "s3_endpoint" {
    vpc_id          = module.vpc.vpc_id
    service_name    = "com.amazonaws.${var.region}.s3"
    route_table_ids = flatten([ module.vpc.private_route_table_ids, module.vpc.public_route_table_ids ])
  tags = {
    Name = "${local.name_prefix}-s3-endpoint"
  }
}
