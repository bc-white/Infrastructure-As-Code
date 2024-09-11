terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.60"
    }
  }
  backend "s3" {
    region  = "us-east-1"
    bucket  = "bcwhite-terraform-state"
    key     = "tf-state
  }
}

provider "aws" {
  region  = "us-east-1"
}

terraform {
}
