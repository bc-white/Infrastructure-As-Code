## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_digitalocean"></a> [digitalocean](#requirement\_digitalocean) | ~> 2.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_digitalocean"></a> [digitalocean](#provider\_digitalocean) | 2.69.0 |
| <a name="provider_tls"></a> [tls](#provider\_tls) | 4.1.0 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [digitalocean_droplet.kubernetes_control_plane_1](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/droplet) | resource |
| [digitalocean_droplet.kubernetes_worker_1](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/droplet) | resource |
| [digitalocean_firewall.kubernetes_firewall](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/firewall) | resource |
| [digitalocean_ssh_key.kubernetes_ssh_key](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/ssh_key) | resource |
| [digitalocean_vpc.kubernetes_vpc_1](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/vpc) | resource |
| [tls_private_key.server_key](https://registry.terraform.io/providers/hashicorp/tls/latest/docs/resources/private_key) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_local_ip"></a> [local\_ip](#input\_local\_ip) | Local IP of the system being used to configure the CKA environment | `string` | `"192.168.1.0"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_kubernetes_control_plane_ip"></a> [kubernetes\_control\_plane\_ip](#output\_kubernetes\_control\_plane\_ip) | The IP of the K8S control plane to log in to administer |
| <a name="output_kubernetes_worker_ip"></a> [kubernetes\_worker\_ip](#output\_kubernetes\_worker\_ip) | The IP of the K8S worker node to log in to administer |
| <a name="output_ssh_key"></a> [ssh\_key](#output\_ssh\_key) | The SSH private key required to log into the new cluster. |
