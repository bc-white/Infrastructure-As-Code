terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  backend "s3" {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "bootstrap/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
    encrypt = true
  }
}

data "aws_caller_identity" "current" {}
