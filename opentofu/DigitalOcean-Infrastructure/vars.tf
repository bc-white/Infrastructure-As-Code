variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID (32-char hex) from dashboard/API (NOT the zone name)."
  validation {
    condition     = length(var.cloudflare_zone_id) == 32 && can(regex("^[a-f0-9]{32}$", var.cloudflare_zone_id))
    error_message = "Provide the 32-character hexadecimal Zone ID, not the domain name (e.g. bcwhite.tech)."
  }
}
