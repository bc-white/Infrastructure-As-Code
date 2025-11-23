variable "cloudflare_record_name" {
  description = "Subdomain to associate with the ingress LoadBalancer. Use '@' for the root."
  type        = string
  default     = "dev"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the root domain (e.g. bcwhite.tech)."
  type        = string
  validation {
    condition     = length(var.cloudflare_zone_id) > 0
    error_message = "cloudflare_zone_id cannot be empty."
  }
}

variable "cloudflare_zone_name" {
  description = "Root domain managed in Cloudflare."
  type        = string
  default     = "bcwhite.tech"
  validation {
    condition = length(var.cloudflare_zone_name) > 0
    error_message = "The Cloudflare zone name cannot be empty"
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
  description = "Ingress NGINX controller image tag (e.g. v1.11.1)."
  type        = string
  default     = "v1.14.0"
  validation {
    condition = can(regex("^v[0-9]+\\.[0-9]+\\.[0-9]+$", var.ingress_nginx_controller_version))
    error_message = "Version must match pattern vMAJOR.MINOR.PATCH (e.g. v1.11.1)."
  }
}

variable "kubernetes_cluster" {
  type = string
  default = "bcwhite-tech-kube-cluster"
  validation {
    condition = length(var.kubernetes_cluster) > 0
    error_message = "The cluster name cannot be empty"
  }
}
