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
  }
  backend "s3" {
    bucket                      = "bcwhite-tech-opentofu-state"
    key                         = "terraform.tfstate"
    region                      = "us-east-1"
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    force_path_style            = true
  }
}

resource "digitalocean_spaces_bucket" "state-bucket" {
  name   = "bcwhite-tech-opentofu-state"
  region = "nyc3"
}

resource "digitalocean_kubernetes_cluster" "kube_cluster" {
  name         = "bcwhite-tech-kube-cluster"
  region       = "nyc3"
  auto_upgrade = true
  version      = "latest"
  maintenance_policy {
    start_time = "04:00"
    day        = "sunday"
  }
  node_pool {
    name       = "default"
    size       = "s-1vcpu-2gb"
    node_count = 2
  }
}
