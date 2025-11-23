## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_cloudflare"></a> [cloudflare](#requirement\_cloudflare) | ~> 5 |
| <a name="requirement_digitalocean"></a> [digitalocean](#requirement\_digitalocean) | ~> 2.0 |
| <a name="requirement_kubernetes"></a> [kubernetes](#requirement\_kubernetes) | ~> 2.19.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_digitalocean"></a> [digitalocean](#provider\_digitalocean) | ~> 2.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/data-sources/kubernetes_cluster) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_kubernetes_cluster"></a> [kubernetes\_cluster](#input\_kubernetes\_cluster) | n/a | `string` | `"bcwhite-tech-kube-cluster"` | no |

## Outputs

No outputs.
