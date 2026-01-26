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
    key     = "environments/test/us-east-1/compute/terraform.tfstate"
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
    bucket = "org-project-tofu-state-xxxxx"
    key    = "bootstrap/terraform.tfstate"
    region = "us-east-1"
  }
}
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "org-project-tofu-state-xxxxx"
    key    = "environments/test/us-east-1/network/terraform.tfstate"
    region = "us-east-1"
  }
}
data "terraform_remote_state" "data" {
  backend = "s3"
  config = {
    bucket = "org-project-tofu-state-xxxxx"
    key    = "environments/test/us-east-1/data/terraform.tfstate"
    region = "us-east-1"
  }
}
