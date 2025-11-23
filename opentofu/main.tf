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
}

resource "digitalocean_spaces_bucket" "foobar" {
  name   = "bcwhite-tech-opentofu-state"
  region = "nyc3"
}
