terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket  = "org-project-tofu-state-xxxxx"
    key     = "environments/test/us-east-1/network/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}

locals {
  name_prefix = "${var.org_name}-${var.project_name}-${var.environment}"
  azs         = ["${var.region}a", "${var.region}b"]
}

data "aws_caller_identity" "current" {}
