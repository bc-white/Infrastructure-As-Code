variable "kubernetes_cluster" {
  type = string
  default = "bcwhite-tech-kube-cluster"
  validation {
    condition = length(var.kubernetes_cluster) > 0
    error_message = "The cluster name cannot be empty"
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
