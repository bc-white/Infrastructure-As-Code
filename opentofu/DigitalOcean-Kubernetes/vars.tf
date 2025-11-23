variable "kubernetes_cluster" {
  type = string
  default = "bcwhite-tech-kube-cluster"
  validation {
    condition = length(var.kubernetes_cluster) > 0
    error_message = "The cluster name cannot be empty"
  }
}
