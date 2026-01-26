provider "aws" {
  region  = var.primary_region
  profile = var.aws_profile
  default_tags {
    tags = {
      ManagedBy    = "OpenTofu"
      Environment  = "organization"
      Organization = var.org_name
      Project      = var.project_name
    }
  }
}

provider "aws" {
  alias   = "dr"
  region  = var.dr_region
  profile = var.aws_profile
  default_tags {
    tags = {
      ManagedBy    = "OpenTofu"
      Environment  = "organization"
      Organization = var.org_name
      Project      = var.project_name
    }
  }
}
