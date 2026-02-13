terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
  backend "s3" {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "environments/test/us-east-1/data/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
    encrypt = true
  }
}

locals {
  name_prefix = "${var.org_name}-${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}
data "terraform_remote_state" "bootstrap" {
  backend = "s3"
  config = {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "bootstrap/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
  }
}
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "environments/test/us-east-1/network/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
  }
}
data "terraform_remote_state" "organization" {
  backend = "s3"
  config = {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "organization/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
  }
}
