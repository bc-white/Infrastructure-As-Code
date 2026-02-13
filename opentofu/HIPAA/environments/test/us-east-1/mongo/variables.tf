variable "aws_profile" {
  description = "AWS CLI profile to use for authentication"
  type        = string
  validation {
    condition     = length(var.aws_profile) > 0
    error_message = "AWS profile must not be empty."
  }
}

variable "database_name" {
  description = "MongoDB database name for application data"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+$", var.database_name))
    error_message = "Database name must contain only alphanumeric characters, underscores, and hyphens."
  }
  validation {
    condition     = length(var.database_name) > 0 && length(var.database_name) <= 64
    error_message = "Database name must be between 1 and 64 characters."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "test"
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

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.region))
    error_message = (
      "Region must be a valid AWS region format (e.g., us-east-1, eu-west-2)."
    )
  }
}
