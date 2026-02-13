## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.0 |
| <a name="requirement_random"></a> [random](#requirement\_random) | ~> 3.6 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 6.31.0 |
| <a name="provider_random"></a> [random](#provider\_random) | 3.8.1 |
| <a name="provider_terraform"></a> [terraform](#provider\_terraform) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_artifacts_bucket"></a> [artifacts\_bucket](#module\_artifacts\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |
| <a name="module_uploads_bucket"></a> [uploads\_bucket](#module\_uploads\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |

## Resources

| Name | Type |
|------|------|
| [aws_elasticache_parameter_group.redis](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elasticache_parameter_group) | resource |
| [aws_elasticache_replication_group.redis](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elasticache_replication_group) | resource |
| [aws_elasticache_subnet_group.redis](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/elasticache_subnet_group) | resource |
| [aws_iam_instance_profile.ec2](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_instance_profile) | resource |
| [aws_iam_policy.ec2_permissions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy) | resource |
| [aws_iam_policy.github_actions_artifacts](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_policy) | resource |
| [aws_iam_role.ec2_instance](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_iam_role_policy_attachment.ec2_permissions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy_attachment) | resource |
| [aws_iam_role_policy_attachment.github_actions_artifacts](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy_attachment) | resource |
| [aws_kms_alias.customer_data](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_alias) | resource |
| [aws_kms_key.customer_data](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key) | resource |
| [aws_kms_key_policy.customer_data](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key_policy) | resource |
| [aws_secretsmanager_secret.jwt_secret](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret) | resource |
| [aws_secretsmanager_secret.redis_auth_token](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret) | resource |
| [aws_secretsmanager_secret_version.jwt_secret](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret_version) | resource |
| [aws_secretsmanager_secret_version.redis_auth_token](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/secretsmanager_secret_version) | resource |
| [aws_security_group.redis](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group) | resource |
| [aws_vpc_security_group_egress_rule.redis_all](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc_security_group_egress_rule) | resource |
| [aws_vpc_security_group_ingress_rule.redis_from_ec2](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc_security_group_ingress_rule) | resource |
| [random_password.jwt_secret](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [random_password.redis_auth_token](https://registry.terraform.io/providers/hashicorp/random/latest/docs/resources/password) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_iam_policy_document.artifacts_bucket_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.ec2_assume_role](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.ec2_permissions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.github_actions_artifacts](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.kms_key_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_iam_policy_document.uploads_bucket_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [terraform_remote_state.bootstrap](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [terraform_remote_state.network](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [terraform_remote_state.organization](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_admin_role_name"></a> [admin\_role\_name](#input\_admin\_role\_name) | IAM Identity Center administrator role name | `string` | n/a | yes |
| <a name="input_aws_profile"></a> [aws\_profile](#input\_aws\_profile) | AWS CLI profile to use for authentication | `string` | n/a | yes |
| <a name="input_environment"></a> [environment](#input\_environment) | Environment name | `string` | `"test"` | no |
| <a name="input_org_name"></a> [org\_name](#input\_org\_name) | Organization name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_redis_node_type"></a> [redis\_node\_type](#input\_redis\_node\_type) | ElastiCache Redis node type | `string` | `"cache.t4g.micro"` | no |
| <a name="input_redis_num_cache_nodes"></a> [redis\_num\_cache\_nodes](#input\_redis\_num\_cache\_nodes) | Number of cache nodes in the Redis replication group | `number` | `1` | no |
| <a name="input_region"></a> [region](#input\_region) | AWS region | `string` | `"us-east-1"` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_artifacts_bucket_arn"></a> [artifacts\_bucket\_arn](#output\_artifacts\_bucket\_arn) | Artifacts bucket ARN |
| <a name="output_artifacts_bucket_name"></a> [artifacts\_bucket\_name](#output\_artifacts\_bucket\_name) | Artifacts bucket name |
| <a name="output_customer_kms_key_arn"></a> [customer\_kms\_key\_arn](#output\_customer\_kms\_key\_arn) | Customer data KMS key ARN |
| <a name="output_customer_kms_key_id"></a> [customer\_kms\_key\_id](#output\_customer\_kms\_key\_id) | Customer data KMS key ID |
| <a name="output_ec2_instance_profile_arn"></a> [ec2\_instance\_profile\_arn](#output\_ec2\_instance\_profile\_arn) | EC2 instance profile ARN |
| <a name="output_ec2_instance_profile_name"></a> [ec2\_instance\_profile\_name](#output\_ec2\_instance\_profile\_name) | EC2 instance profile name |
| <a name="output_ec2_role_arn"></a> [ec2\_role\_arn](#output\_ec2\_role\_arn) | EC2 IAM role ARN |
| <a name="output_ec2_role_name"></a> [ec2\_role\_name](#output\_ec2\_role\_name) | EC2 IAM role name |
| <a name="output_jwt_secret_arn"></a> [jwt\_secret\_arn](#output\_jwt\_secret\_arn) | JWT secret ARN |
| <a name="output_redis_auth_token_secret_arn"></a> [redis\_auth\_token\_secret\_arn](#output\_redis\_auth\_token\_secret\_arn) | Redis auth token secret ARN |
| <a name="output_redis_port"></a> [redis\_port](#output\_redis\_port) | Redis port |
| <a name="output_redis_primary_endpoint"></a> [redis\_primary\_endpoint](#output\_redis\_primary\_endpoint) | Redis primary endpoint |
| <a name="output_redis_security_group_id"></a> [redis\_security\_group\_id](#output\_redis\_security\_group\_id) | Redis security group ID |
| <a name="output_uploads_bucket_arn"></a> [uploads\_bucket\_arn](#output\_uploads\_bucket\_arn) | Uploads bucket ARN |
| <a name="output_uploads_bucket_name"></a> [uploads\_bucket\_name](#output\_uploads\_bucket\_name) | Uploads bucket name |
