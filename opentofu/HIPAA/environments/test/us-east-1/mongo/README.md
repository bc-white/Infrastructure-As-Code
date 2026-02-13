## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.0 |
| <a name="requirement_mongodbatlas"></a> [mongodbatlas](#requirement\_mongodbatlas) | ~> 2.6 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 6.31.0 |
| <a name="provider_mongodbatlas"></a> [mongodbatlas](#provider\_mongodbatlas) | 2.6.0 |
| <a name="provider_terraform"></a> [terraform](#provider\_terraform) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [mongodbatlas_advanced_cluster.primary](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs/resources/advanced_cluster) | resource |
| [mongodbatlas_database_user.ec2_iam](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs/resources/database_user) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [terraform_remote_state.data](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [terraform_remote_state.mongo_org](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_profile"></a> [aws\_profile](#input\_aws\_profile) | AWS CLI profile to use for authentication | `string` | n/a | yes |
| <a name="input_database_name"></a> [database\_name](#input\_database\_name) | MongoDB database name for application data | `string` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | Environment name | `string` | `"test"` | no |
| <a name="input_mongodbatlas_private_key"></a> [mongodbatlas\_private\_key](#input\_mongodbatlas\_private\_key) | MongoDB Atlas private key for API authentication | `string` | n/a | yes |
| <a name="input_mongodbatlas_public_key"></a> [mongodbatlas\_public\_key](#input\_mongodbatlas\_public\_key) | MongoDB Atlas public key for API authentication | `string` | n/a | yes |
| <a name="input_org_name"></a> [org\_name](#input\_org\_name) | Organization name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | AWS region | `string` | `"us-east-1"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cluster_connection_string"></a> [cluster\_connection\_string](#output\_cluster\_connection\_string) | MongoDB Atlas cluster connection string |
| <a name="output_cluster_id"></a> [cluster\_id](#output\_cluster\_id) | MongoDB Atlas cluster ID |
| <a name="output_cluster_name"></a> [cluster\_name](#output\_cluster\_name) | MongoDB Atlas cluster name |
| <a name="output_cluster_state"></a> [cluster\_state](#output\_cluster\_state) | MongoDB Atlas cluster state |
