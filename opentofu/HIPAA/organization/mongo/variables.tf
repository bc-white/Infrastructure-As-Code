variable "aws_profile" {
  description = "AWS CLI profile to use for authentication"
  type        = string
  validation {
    condition     = length(var.aws_profile) > 0
    error_message = "AWS profile must not be empty."
  }
}

variable "mongodbatlas_org_id" {
  description = "MongoDB Atlas organization ID"
  type        = string
  validation {
    condition     = length(var.mongodbatlas_org_id) > 0
    error_message = "MongoDB Atlas organization ID must not be empty."
  }
}

variable "mongodbatlas_private_key" {
  description = "MongoDB Atlas private key for API authentication"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.mongodbatlas_private_key) > 0
    error_message = "MongoDB Atlas private key must not be empty."
  }
}

variable "mongodbatlas_public_key" {
  description = "MongoDB Atlas public key for API authentication"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.mongodbatlas_public_key) > 0
    error_message = "MongoDB Atlas public key must not be empty."
  }
}

variable "org_name" {
  description = "Organization name, used for resource naming and tagging"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.org_name))
    error_message = "Organization name must contain only lowercase letters, numbers, and hyphens."
  }
  validation {
    condition     = length(var.org_name) > 0 && length(var.org_name) <= 32
    error_message = "Organization name must be between 1 and 32 characters."
  }
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.primary_region))
    error_message = (
      "Primary region must be a valid AWS region format (e.g., us-east-1, eu-west-2)."
    )
  }
}

variable "project_name" {
  description = "Project name, used for resource naming and tagging"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
  validation {
    condition     = length(var.project_name) > 0 && length(var.project_name) <= 32
    error_message = "Project name must be between 1 and 32 characters."
  }
}
