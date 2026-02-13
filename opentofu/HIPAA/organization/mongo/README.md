## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.0 |
| <a name="requirement_mongodbatlas"></a> [mongodbatlas](#requirement\_mongodbatlas) | ~> 1.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_mongodbatlas"></a> [mongodbatlas](#provider\_mongodbatlas) | 1.41.1 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [mongodbatlas_project.main](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs/resources/project) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_profile"></a> [aws\_profile](#input\_aws\_profile) | AWS CLI profile to use for authentication | `string` | n/a | yes |
| <a name="input_mongodbatlas_org_id"></a> [mongodbatlas\_org\_id](#input\_mongodbatlas\_org\_id) | MongoDB Atlas organization ID | `string` | n/a | yes |
| <a name="input_mongodbatlas_private_key"></a> [mongodbatlas\_private\_key](#input\_mongodbatlas\_private\_key) | MongoDB Atlas private key for API authentication | `string` | n/a | yes |
| <a name="input_mongodbatlas_public_key"></a> [mongodbatlas\_public\_key](#input\_mongodbatlas\_public\_key) | MongoDB Atlas public key for API authentication | `string` | n/a | yes |
| <a name="input_org_name"></a> [org\_name](#input\_org\_name) | Organization name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | Primary AWS region | `string` | `"us-east-1"` | no |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name, used for resource naming and tagging | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_mongodb_project_id"></a> [mongodb\_project\_id](#output\_mongodb\_project\_id) | MongoDB Atlas project ID |
| <a name="output_mongodb_project_name"></a> [mongodb\_project\_name](#output\_mongodb\_project\_name) | MongoDB Atlas project name |
