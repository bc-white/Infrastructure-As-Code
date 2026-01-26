provider "aws" {
  region  = var.region
  profile = var.aws_profile
  default_tags {
    tags = {
      ManagedBy    = "OpenTofu"
      Environment  = var.environment
      Organization = var.org_name
      Project      = var.project_name
      Layer        = "data"
    }
  }
}
