terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "environments/test/us-east-1/network/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
    encrypt = true
  }
}

locals {
  name_prefix = "${var.org_name}-${var.project_name}-${var.environment}"
  azs         = ["${var.region}a", "${var.region}b"]
}

data "aws_caller_identity" "current" {}
