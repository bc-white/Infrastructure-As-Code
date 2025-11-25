resource "cloudflare_dns_record" "ingress_controller_lb_dns_record" {
  zone_id = var.cloudflare_zone_id
  name    = var.cloudflare_record_name
  type    = "A"
  content = try(data.kubernetes_service.ingress_nginx_controller.status[0].load_balancer[0].ingress[0].ip, "")
  ttl     = var.cloudflare_dns_ttl_automatic
  proxied = true
}
