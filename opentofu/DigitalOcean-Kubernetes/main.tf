terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.19.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
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

provider "kubernetes" {
  host  = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.endpoint
  token = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].cluster_ca_certificate
  )
}

provider "helm" {
  kubernetes {
    host                   = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.endpoint
    token                  = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].token
    cluster_ca_certificate = base64decode(data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].cluster_ca_certificate)
  }
}

data "digitalocean_kubernetes_cluster" "bcwhite-tech-k8s-cluster" {
  name = var.kubernetes_cluster
}

data "kubernetes_service" "ingress_nginx_controller" {
  depends_on = [helm_release.ingress_nginx]
  metadata {
    name      = "ingress-nginx-controller"
    namespace = kubernetes_namespace.ingress.metadata[0].name
  }
}

resource "kubernetes_namespace" "ingress" {
  metadata { name = "ingress-nginx" }
}

resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = var.ingress_nginx_chart_version
  namespace        = kubernetes_namespace.ingress.metadata[0].name
  create_namespace = false

  values = [templatefile("${path.module}/ingress-nginx-values.yaml.tmpl", {
    controller_image_tag = var.ingress_nginx_controller_version
  })]
}
