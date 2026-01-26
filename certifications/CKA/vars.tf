variable "local_ip" {
  description = "Local IP of the system being used to configure the CKA environment"
  type        = string
  default     = "192.168.1.1"
  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}$", var.local_ip))
    error_message = "The local_ip must be a valid IPv4 address."
  }
}
