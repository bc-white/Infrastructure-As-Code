variable "admin_role_name" {
  description = "IAM Identity Center administrator role name"
  type        = string
  validation {
    condition     = length(var.admin_role_name) > 0
    error_message = "Admin role name must not be empty."
  }
}

variable "aws_profile" {
  description = "AWS CLI profile to use for authentication"
  type        = string
  validation {
    condition     = length(var.aws_profile) > 0
    error_message = "AWS profile must not be empty."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "test"
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

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.micro"
  validation {
    condition     = can(regex("^cache\\.[a-z0-9]+\\.[a-z0-9]+$", var.redis_node_type))
    error_message = "Redis node type must be a valid ElastiCache instance type (e.g., cache.t4g.micro)."
  }
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the Redis replication group"
  type        = number
  default     = 1
  validation {
    condition     = var.redis_num_cache_nodes >= 1 && var.redis_num_cache_nodes <= 6
    error_message = "Number of cache nodes must be between 1 and 6."
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
