resource "cloudflare_ruleset" "block_non_us" {
  name        = "block-non-us-countries"
  description = "Block any traffic not originating from the United States"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  zone_id     = var.cloudflare_zone_id
  rules = [ {
    action = "block"
    expression = "(not ip.geoip.country in {\"US\"})"
    description = "Block any request not from US"
  } ]
}
