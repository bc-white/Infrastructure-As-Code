terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.19.0"
    }
  }
  backend "s3" {
    bucket                      = "bcwhite-tech-opentofu-state"
    key                         = "k8s/terraform.tfstate"
    region                      = "us-east-1"
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    force_path_style            = true
  }
}

data "digitalocean_kubernetes_cluster" "bcwhite-tech-k8s-cluster" {
  name = var.kubernetes_cluster
}

provider "kubernetes" {
  host  = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.endpoint
  token = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].cluster_ca_certificate
  )
}
