output "ssh_key" {
  description = "The SSH private key required to log into the new cluster."
  sensitive = true
  value = tls_private_key.server_key.private_key_pem
}

output "kubernetes_control_plane_ip" {
  description = "The IP of the K8S control plane to log in to administer"
  value = digitalocean_droplet.kubernetes_control_plane_1.ipv4_address
}

output "kubernetes_worker_ip" {
  description = "The IP of the K8S worker node to log in to administer"
  value = digitalocean_droplet.kubernetes_worker_1.ipv4_address
}
