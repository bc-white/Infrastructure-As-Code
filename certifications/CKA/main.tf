terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
  backend "s3" {
    bucket                      = "bcwhite-tech-opentofu-state"
    key                         = "cka/terraform.tfstate"
    region                      = "us-east-1"
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    force_path_style            = true
  }
}

resource "tls_private_key" "server_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "digitalocean_ssh_key" "kubernetes_ssh_key" {
  name       = "kubernetes-development-ssh-key"
  public_key = tls_private_key.server_key.public_key_openssh
}

resource "digitalocean_vpc" "kubernetes_vpc_1" {
  name     = "kubernetes-development-network"
  region   = "nyc3"
  ip_range = "10.10.10.0/24"
}

resource "digitalocean_firewall" "kubernetes_firewall" {
  name = "web-fw"
  tags = ["cka"]
  inbound_rule {
    protocol         = "tcp"
    port_range       = "1-65535"
    source_addresses = [var.local_ip]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "1-65535"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol = "tcp"
    port_range = "1-65535"
    source_tags = ["cka"]
  }
  inbound_rule {
    protocol    = "udp"
    port_range  = "1-65535"
    source_tags = ["cka"]
  }
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["10.0.0.0/8", "::/0"]
  }
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "icmp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

resource "digitalocean_droplet" "kubernetes_control_plane_1" {
  name   = "k8s-control-plane"
  region = "nyc3"
  size   = "s-2vcpu-4gb"
  image  = "ubuntu-24-04-x64"
  user_data = file("cloud-init.yaml")
  ssh_keys = [digitalocean_ssh_key.kubernetes_ssh_key.id]
  vpc_uuid = digitalocean_vpc.kubernetes_vpc_1.id
  tags = ["kubernetes","cka","control-plane","development"]
}

resource "digitalocean_droplet" "kubernetes_worker_1" {
  name   = "k8s-worker-1"
  region = "nyc3"
  size   = "s-2vcpu-4gb"
  image  = "ubuntu-24-04-x64"
  user_data = file("cloud-init.yaml")
  ssh_keys = [digitalocean_ssh_key.kubernetes_ssh_key.id]
  vpc_uuid = digitalocean_vpc.kubernetes_vpc_1.id
  tags = ["kubernetes","cka","worker","development"]
}
