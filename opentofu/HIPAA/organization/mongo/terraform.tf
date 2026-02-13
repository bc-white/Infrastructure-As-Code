terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.0"
    }
  }
  backend "s3" {
    bucket  = "inspac-mocksurvey365-tofu-state-03e07a7f"
    key     = "organization/mongo/terraform.tfstate"
    profile = "InsPAC-Admin"
    region  = "us-east-1"
    encrypt = true
  }
}
