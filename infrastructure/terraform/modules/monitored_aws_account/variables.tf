variable "budget_alert_emails" {
  type        = list(string)
  description = "List of email addresses to notify when budget thresholds are exceeded"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", join(",", var.budget_alert_emails)))
    error_message = "The email addresses must be valid."
  }
}

variable "budget_alert_phone_numbers" {
  type        = list(string)
  description = "List of phone numbers to notify when budget thresholds are exceeded"
  validation {
    condition     = can(regex("^\\+?[1-9]\\d{1,14}$", join(",", var.budget_alert_phone_numbers)))
    error_message = "The phone numbers must be valid."
  }
}

variable "budget_alert_threshold_daily" {
  type        = number
  description = "Percentage threshold for daily budget alerts"
  default     = 25
  validation {
    condition     = var.budget_alert_threshold_daily > 0 && var.budget_alert_threshold_daily <= 100
    error_message = "The daily budget threshold must be between 0 and 100."
  }
}

variable "budget_alert_threshold_monthly" {
  type        = number
  description = "Percentage threshold for monthly budget alerts"
  default     = 75
  validation {
    condition     = var.budget_alert_threshold_monthly > 0 && var.budget_alert_threshold_monthly <= 100
    error_message = "The monthly budget threshold must be between 0 and 100."
  }
}

variable "budget_amount_daily" {
  type        = number
  description = "Daily budget amount"
  default     = 3.0
  validation {
    condition     = var.budget_amount_daily > 0 && var.budget_amount_daily <= 10
    error_message = "The daily budget amount must be greater than 0 and less than or equal to 10."
  }
}

variable "budget_amount_monthly" {
  type        = number
  description = "Monthly budget amount"
  default     = 15.0
  validation {
    condition     = var.budget_amount_monthly > 0 && var.budget_amount_daily <= 1000
    error_message = "The monthly budget amount must be greater than 0 and less than or equal to 1000."
  }
}

variable "enviroment" {
  type        = string
  description = "The environment for the monitored account"
  validation {
    condition     = can(regex("^(dev|test|prod)$", var.enviroment))
    error_message = "The environment must be either dev, test, or prod."
  }
}
