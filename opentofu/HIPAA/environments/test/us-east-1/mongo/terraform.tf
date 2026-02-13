terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 2.6"
    }
  }
  backend "s3" {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "environments/test/us-east-1/mongo/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
    encrypt = true
  }
}

locals {
  name_prefix = "${var.org_name}-${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}

data "terraform_remote_state" "data" {
  backend = "s3"
  config = {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "environments/test/us-east-1/data/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
  }
}

data "terraform_remote_state" "mongo_org" {
  backend = "s3"
  config = {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "organization/mongo/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
  }
}
