## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.0 |
| <a name="requirement_random"></a> [random](#requirement\_random) | ~> 3.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 6.28.0 |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | 6.28.0 |
| <a name="provider_random"></a> [random](#provider\_random) | 3.8.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_s3_access_logs"></a> [s3\_access\_logs](#module\_s3\_access\_logs) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |
| <a name="module_s3_access_logs_dr"></a> [s3\_access\_logs\_dr](#module\_s3\_access\_logs\_dr) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |
| <a name="module_s3_bucket"></a> [s3\_bucket](#module\_s3\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |

## Resources

| Name | Type |
|------|------|
| [aws_iam_policy.s3_replication](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy) | resource |
| [aws_iam_role.s3_replication](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role_policy_attachment.s3_replication](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy_attachment) | resource |
| [aws_kms_alias.org_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_alias) | resource |
| [aws_kms_alias.org_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_alias) | resource |
| [aws_kms_key.org_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key) | resource |
| [aws_kms_replica_key.org_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_replica_key) | resource |
| [random_id.bucket_suffix](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/id) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_iam_policy_document.kms_org_key](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.s3_replication](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.s3_replication_assume](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_admin_role_name"></a> [admin\_role\_name](#input\_admin\_role\_name) | IAM Identity Center administrator role name | `string` | n/a | yes |
| <a name="input_aws_profile"></a> [aws\_profile](#input\_aws\_profile) | AWS CLI profile to use for authentication | `string` | `"InsPAC-Admin"` | no |
| <a name="input_dr_region"></a> [dr\_region](#input\_dr\_region) | Disaster recovery AWS region for multi-region resources | `string` | `"us-west-2"` | no |
| <a name="input_enable_versioning"></a> [enable\_versioning](#input\_enable\_versioning) | Enable versioning on the state bucket | `bool` | `true` | no |
| <a name="input_org_name"></a> [org\_name](#input\_org\_name) | Organization name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | Primary AWS region | `string` | `"us-east-1"` | no |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name, used for resource naming and tagging | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_backend_config"></a> [backend\_config](#output\_backend\_config) | Backend configuration to use in other OpenTofu configurations |
| <a name="output_org_kms_key_alias"></a> [org\_kms\_key\_alias](#output\_org\_kms\_key\_alias) | Organization KMS key alias |
| <a name="output_org_kms_key_arn"></a> [org\_kms\_key\_arn](#output\_org\_kms\_key\_arn) | Organization KMS key ARN (same in both regions) |
| <a name="output_org_kms_key_id"></a> [org\_kms\_key\_id](#output\_org\_kms\_key\_id) | Organization KMS key ID (same in both regions) |
| <a name="output_s3_access_logs_bucket_arn"></a> [s3\_access\_logs\_bucket\_arn](#output\_s3\_access\_logs\_bucket\_arn) | S3 access logs bucket ARN |
| <a name="output_s3_access_logs_bucket_name"></a> [s3\_access\_logs\_bucket\_name](#output\_s3\_access\_logs\_bucket\_name) | S3 access logs bucket name |
| <a name="output_s3_access_logs_dr_bucket_arn"></a> [s3\_access\_logs\_dr\_bucket\_arn](#output\_s3\_access\_logs\_dr\_bucket\_arn) | S3 access logs DR bucket ARN |
| <a name="output_s3_access_logs_dr_bucket_name"></a> [s3\_access\_logs\_dr\_bucket\_name](#output\_s3\_access\_logs\_dr\_bucket\_name) | S3 access logs DR bucket name |
| <a name="output_state_bucket_arn"></a> [state\_bucket\_arn](#output\_state\_bucket\_arn) | ARN of the S3 bucket for OpenTofu state |
| <a name="output_state_bucket_name"></a> [state\_bucket\_name](#output\_state\_bucket\_name) | Name of the S3 bucket for OpenTofu state |
