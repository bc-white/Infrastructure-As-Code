## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_cloudflare"></a> [cloudflare](#requirement\_cloudflare) | ~> 5.0 |
| <a name="requirement_digitalocean"></a> [digitalocean](#requirement\_digitalocean) | ~> 2.0 |
| <a name="requirement_helm"></a> [helm](#requirement\_helm) | ~> 2.12 |
| <a name="requirement_kubernetes"></a> [kubernetes](#requirement\_kubernetes) | ~> 2.19.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_cloudflare"></a> [cloudflare](#provider\_cloudflare) | 5.13.0 |
| <a name="provider_digitalocean"></a> [digitalocean](#provider\_digitalocean) | 2.69.0 |
| <a name="provider_helm"></a> [helm](#provider\_helm) | 2.17.0 |
| <a name="provider_kubernetes"></a> [kubernetes](#provider\_kubernetes) | 2.19.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [cloudflare_dns_record.ingress_controller_lb_dns_record](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs/resources/dns_record) | resource |
| [helm_release.ingress_nginx](https://registry.terraform.io/providers/hashicorp/helm/latest/docs/resources/release) | resource |
| [kubernetes_deployment.nginx_dev](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/deployment) | resource |
| [kubernetes_ingress_v1.nginx_dev](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/ingress_v1) | resource |
| [kubernetes_namespace.ingress](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/namespace) | resource |
| [kubernetes_service.nginx_dev](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/resources/service) | resource |
| [digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/data-sources/kubernetes_cluster) | data source |
| [kubernetes_service.ingress_nginx_controller](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs/data-sources/service) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_cloudflare_record_name"></a> [cloudflare\_record\_name](#input\_cloudflare\_record\_name) | Subdomain to associate with the ingress LoadBalancer. Use '@' for the root. | `string` | `"dev"` | no |
| <a name="input_cloudflare_zone_id"></a> [cloudflare\_zone\_id](#input\_cloudflare\_zone\_id) | Cloudflare Zone ID (32-char hex) from dashboard/API (NOT the zone name). | `string` | `""` | no |
| <a name="input_cloudflare_zone_name"></a> [cloudflare\_zone\_name](#input\_cloudflare\_zone\_name) | Root domain managed in Cloudflare. | `string` | `"bcwhite.tech"` | no |
| <a name="input_ingress_nginx_chart_version"></a> [ingress\_nginx\_chart\_version](#input\_ingress\_nginx\_chart\_version) | Helm chart version for ingress-nginx (e.g. 4.10.0). | `string` | `"4.10.0"` | no |
| <a name="input_ingress_nginx_controller_version"></a> [ingress\_nginx\_controller\_version](#input\_ingress\_nginx\_controller\_version) | Ingress NGINX controller image tag (e.g. v1.11.1). | `string` | `"v1.14.0"` | no |
| <a name="input_kubernetes_cluster"></a> [kubernetes\_cluster](#input\_kubernetes\_cluster) | n/a | `string` | `"bcwhite-tech-kube-cluster"` | no |

## Outputs

No outputs.
