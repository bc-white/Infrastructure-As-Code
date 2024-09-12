terraform {
  required_version = "~> 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  
  backend "s3" {
    region  = "us-east-1"
    bucket  = "bcwhite-terraform-state"
    key     = "tf-state"
    profile = "Personal-bc_white"
  }
}

provider "aws" {
    region  = "us-east-1"
    profile = "Personal-bc_white"
}

module "monitored_aws_account" {
    source                          = "./modules/monitored_aws_account"
    budget_alert_emails             = ["bc_white@outlook.com"]
    budget_alert_phone_numbers      = ["+17038012913"]
    budget_alert_threshold_daily    = 25
    budget_alert_threshold_monthly  = 75
    budget_amount_daily             = 1.0
    budget_amount_monthly           = 5.0
    enviroment                      = "dev"
}
