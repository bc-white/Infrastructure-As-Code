variable "local_ip" {
  description = "Local IP of the system being used to configure the CKA environment"
  type        = string
  default     = "192.168.1.1"
  validation {
    condition     = can(
      regex("^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$",
      var.local_ip))
    error_message = "The local_ip must be a valid IPv4 address."
  }
}
