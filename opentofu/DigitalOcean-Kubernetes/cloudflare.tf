data "cloudflare_zones" "primary" {
  filter {
    name = var.cloudflare_zone_name
  }
}

locals {
  lb_ip       = try(data.kubernetes_service.ingress_nginx_controller.status[0].load_balancer[0].ingress[0].ip, null)
  lb_hostname = try(data.kubernetes_service.ingress_nginx_controller.status[0].load_balancer[0].ingress[0].hostname, null)
  lb_address  = coalesce(local.lb_ip, local.lb_hostname)
  is_ipv4     = can(regex("^[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}$", local.lb_ip))
  zone_id     = length(data.cloudflare_zones.primary.zones) > 0 ? data.cloudflare_zones.primary.zones[0].id : null
}

resource "cloudflare_record" "ingress_controller_lb_dns_record" {
  count   = local.lb_address != null && local.zone_id != null ? 1 : 0
  zone_id = local.zone_id
  name    = var.cloudflare_record_name
  type    = local.is_ipv4 ? "A" : "CNAME"
  value   = local.lb_address
  ttl     = 300
  proxied = true
}
