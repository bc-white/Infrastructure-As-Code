variable "aws_profile" {
  description = "AWS CLI profile to use for authentication"
  type        = string
  validation {
    condition     = length(var.aws_profile) > 0
    error_message = "AWS profile must not be empty."
  }
}

variable "domain_name" {
  description = "Primary domain name for the organization"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*[a-z0-9]\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid DNS name format."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "test"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
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
