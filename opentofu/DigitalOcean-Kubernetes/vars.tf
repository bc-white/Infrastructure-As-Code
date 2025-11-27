# TTL of 1 means "automatic" in Cloudflare's API. See https://api.cloudflare.com/#dns-records-for-a-zone-create-dns-record
variable "cloudflare_dns_ttl_automatic" {
  description = "TTL value of 1 means 'automatic' in Cloudflare's API"
  type        = number
  default     = 1
}

variable "cloudflare_record_name" {
  description = "Subdomain to associate with the ingress LoadBalancer. Use '@' for the root."
  type        = string
  default     = "dev"
  validation {
    condition = length(var.cloudflare_record_name) > 0
    error_message = "Cloudflare record name cannot be empty."
  }
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID (32-char hex) from dashboard/API (NOT the zone name)."
  validation {
    condition     = length(var.cloudflare_zone_id) == 32 && can(regex("^[a-f0-9]{32}$", var.cloudflare_zone_id))
    error_message = "Provide the 32-character hexadecimal Zone ID, not the domain name (e.g. bcwhite.tech)."
  }
}

variable "cloudflare_zone_name" {
  description = "Root domain managed in Cloudflare."
  type        = string
  default     = "bcwhite.tech"
  validation {
    condition = length(var.cloudflare_zone_name) > 0
    error_message = "The Cloudflare zone name cannot be empty."
  }
}

variable "ingress_nginx_chart_version" {
  description = "Helm chart version for ingress-nginx (e.g. 4.10.0)."
  type        = string
  default     = "4.10.0"
  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+$", var.ingress_nginx_chart_version))
    error_message = "Chart version must be numeric semantic version (e.g. 4.10.0)."
  }
}

variable "ingress_nginx_controller_version" {
  description = "Ingress NGINX controller image tag (e.g. v1.14.0)."
  type        = string
  default     = "v1.14.0"
  validation {
    condition = can(regex("^v[0-9]+\\.[0-9]+\\.[0-9]+$", var.ingress_nginx_controller_version))
    error_message = "Version must match pattern vMAJOR.MINOR.PATCH (e.g. v1.14.0)."
  }
}

variable "kubernetes_cluster" {
  description = "Name of the DigitalOcean Kubernetes cluster to deploy to."
  type = string
  default = "bcwhite-tech-kube-cluster"
  validation {
    condition = length(var.kubernetes_cluster) > 0
    error_message = "The cluster name cannot be empty."
  }
}
