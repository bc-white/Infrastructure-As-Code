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
    error_message = "Domain name must be a valid domain format (e.g., example.com)."
  }
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = "us-west-2"
  validation {
    condition = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.dr_region))
    error_message = (
      "DR region must be a valid AWS region format (e.g., us-west-2, eu-west-1)."
    )
  }
}

variable "guardduty_finding_publishing_frequency" {
  description = "Frequency of GuardDuty findings publishing (FIFTEEN_MINUTES, ONE_HOUR, SIX_HOURS)"
  type        = string
  default     = "SIX_HOURS"
  validation {
    condition     = contains(["FIFTEEN_MINUTES", "ONE_HOUR", "SIX_HOURS"], var.guardduty_finding_publishing_frequency)
    error_message = "Publishing frequency must be FIFTEEN_MINUTES, ONE_HOUR, or SIX_HOURS."
  }
}

variable "notification_emails" {
  description = "List of email addresses to receive GuardDuty notifications"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for email in var.notification_emails : can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email))
    ])
    error_message = "All email addresses must be valid email format."
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
