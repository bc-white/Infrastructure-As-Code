provider "aws" {
  region      = var.primary_region
  profile     = var.aws_profile
  max_retries = 10
  retry_mode  = "adaptive"
  default_tags {
    tags = {
      ManagedBy    = "OpenTofu"
      Environment  = "organization"
      Organization = var.org_name
      Project      = var.project_name
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.mongodbatlas_public_key
  private_key = var.mongodbatlas_private_key
}
