variable "region" {
  description = "The AWS region to deploy the resources"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^(us-east-1|us-east-2|us-west-1)$", var.region))
    error_message = "The region must be either us-east-1, us-east-2, or us-west-1"
  }
}
