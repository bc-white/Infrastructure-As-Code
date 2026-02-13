## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.6.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 6.31.0 |
| <a name="provider_aws.dr"></a> [aws.dr](#provider\_aws.dr) | 6.31.0 |
| <a name="provider_terraform"></a> [terraform](#provider\_terraform) | n/a |
| <a name="provider_tls"></a> [tls](#provider\_tls) | 4.2.1 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_cloudtrail_bucket"></a> [cloudtrail\_bucket](#module\_cloudtrail\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |
| <a name="module_guardduty_findings_bucket"></a> [guardduty\_findings\_bucket](#module\_guardduty\_findings\_bucket) | terraform-aws-modules/s3-bucket/aws | ~> 5.0 |
| <a name="module_guardduty_notifications"></a> [guardduty\_notifications](#module\_guardduty\_notifications) | terraform-aws-modules/sns/aws | ~> 7.1 |

## Resources

| Name | Type |
|------|------|
| [aws_cloudtrail.organization](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudtrail) | resource |
| [aws_cloudwatch_event_rule.guardduty_findings_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_rule.guardduty_findings_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_rule) | resource |
| [aws_cloudwatch_event_target.sns_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_cloudwatch_event_target.sns_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_event_target) | resource |
| [aws_guardduty_detector.dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector) | resource |
| [aws_guardduty_detector.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector) | resource |
| [aws_guardduty_detector_feature.ebs_malware_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector_feature) | resource |
| [aws_guardduty_detector_feature.ebs_malware_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector_feature) | resource |
| [aws_guardduty_detector_feature.s3_dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector_feature) | resource |
| [aws_guardduty_detector_feature.s3_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_detector_feature) | resource |
| [aws_guardduty_organization_admin_account.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_organization_admin_account) | resource |
| [aws_guardduty_organization_configuration.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_organization_configuration) | resource |
| [aws_guardduty_organization_configuration_feature.ebs_malware_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_organization_configuration_feature) | resource |
| [aws_guardduty_organization_configuration_feature.s3_primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_organization_configuration_feature) | resource |
| [aws_guardduty_publishing_destination.dr](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_publishing_destination) | resource |
| [aws_guardduty_publishing_destination.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/guardduty_publishing_destination) | resource |
| [aws_iam_openid_connect_provider.github](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_openid_connect_provider) | resource |
| [aws_iam_role.github_actions](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role) | resource |
| [aws_kms_alias.dnssec](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_alias) | resource |
| [aws_kms_key.dnssec](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key) | resource |
| [aws_kms_key_policy.dnssec](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/kms_key_policy) | resource |
| [aws_route53_hosted_zone_dnssec.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_hosted_zone_dnssec) | resource |
| [aws_route53_key_signing_key.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_key_signing_key) | resource |
| [aws_route53_record.root_mx](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_record.root_txt](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_record.ses_dkim](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_record.ses_dmarc](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_record.ses_send_mx](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_record.ses_send_subdomain](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |
| [aws_route53_zone.primary](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_zone) | resource |
| [aws_sesv2_configuration_set.main](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sesv2_configuration_set) | resource |
| [aws_sesv2_configuration_set_event_destination.cloudwatch](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sesv2_configuration_set_event_destination) | resource |
| [aws_sesv2_email_identity.domain](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sesv2_email_identity) | resource |
| [aws_caller_identity.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity) | data source |
| [aws_iam_policy_document.dnssec_kms_policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document) | data source |
| [aws_organizations_organization.current](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/organizations_organization) | data source |
| [terraform_remote_state.bootstrap](https://registry.terraform.io/providers/hashicorp/terraform/latest/docs/data-sources/remote_state) | data source |
| [tls_certificate.github](https://registry.terraform.io/providers/hashicorp/tls/latest/docs/data-sources/certificate) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_profile"></a> [aws\_profile](#input\_aws\_profile) | AWS CLI profile to use for authentication | `string` | n/a | yes |
| <a name="input_domain_name"></a> [domain\_name](#input\_domain\_name) | Primary domain name for the organization | `string` | n/a | yes |
| <a name="input_dr_region"></a> [dr\_region](#input\_dr\_region) | Disaster recovery AWS region | `string` | `"us-west-2"` | no |
| <a name="input_github_org"></a> [github\_org](#input\_github\_org) | GitHub organization or user name for OIDC trust relationship | `string` | n/a | yes |
| <a name="input_guardduty_finding_publishing_frequency"></a> [guardduty\_finding\_publishing\_frequency](#input\_guardduty\_finding\_publishing\_frequency) | Frequency of GuardDuty findings publishing (FIFTEEN\_MINUTES, ONE\_HOUR, SIX\_HOURS) | `string` | `"SIX_HOURS"` | no |
| <a name="input_notification_emails"></a> [notification\_emails](#input\_notification\_emails) | List of email addresses to receive GuardDuty notifications | `list(string)` | `[]` | no |
| <a name="input_org_name"></a> [org\_name](#input\_org\_name) | Organization name, used for resource naming and tagging | `string` | n/a | yes |
| <a name="input_primary_region"></a> [primary\_region](#input\_primary\_region) | Primary AWS region | `string` | `"us-east-1"` | no |
| <a name="input_project_name"></a> [project\_name](#input\_project\_name) | Project name, used for resource naming and tagging | `string` | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cloudtrail_arn"></a> [cloudtrail\_arn](#output\_cloudtrail\_arn) | CloudTrail trail ARN |
| <a name="output_cloudtrail_bucket_arn"></a> [cloudtrail\_bucket\_arn](#output\_cloudtrail\_bucket\_arn) | S3 bucket ARN for CloudTrail logs |
| <a name="output_cloudtrail_bucket_name"></a> [cloudtrail\_bucket\_name](#output\_cloudtrail\_bucket\_name) | S3 bucket name for CloudTrail logs |
| <a name="output_cloudtrail_id"></a> [cloudtrail\_id](#output\_cloudtrail\_id) | CloudTrail trail ID |
| <a name="output_eventbridge_rule_dr"></a> [eventbridge\_rule\_dr](#output\_eventbridge\_rule\_dr) | EventBridge rule name in DR region |
| <a name="output_eventbridge_rule_primary"></a> [eventbridge\_rule\_primary](#output\_eventbridge\_rule\_primary) | EventBridge rule name in primary region |
| <a name="output_findings_bucket_arn"></a> [findings\_bucket\_arn](#output\_findings\_bucket\_arn) | S3 bucket ARN for GuardDuty findings |
| <a name="output_findings_bucket_name"></a> [findings\_bucket\_name](#output\_findings\_bucket\_name) | S3 bucket name for GuardDuty findings |
| <a name="output_github_actions_role_arn"></a> [github\_actions\_role\_arn](#output\_github\_actions\_role\_arn) | IAM role ARN for GitHub Actions OIDC |
| <a name="output_guardduty_detector_id_dr"></a> [guardduty\_detector\_id\_dr](#output\_guardduty\_detector\_id\_dr) | GuardDuty detector ID in DR region |
| <a name="output_guardduty_detector_id_primary"></a> [guardduty\_detector\_id\_primary](#output\_guardduty\_detector\_id\_primary) | GuardDuty detector ID in primary region |
| <a name="output_hosted_zone_id"></a> [hosted\_zone\_id](#output\_hosted\_zone\_id) | Route 53 hosted zone ID |
| <a name="output_hosted_zone_name_servers"></a> [hosted\_zone\_name\_servers](#output\_hosted\_zone\_name\_servers) | Route 53 hosted zone name servers |
| <a name="output_ses_configuration_set_name"></a> [ses\_configuration\_set\_name](#output\_ses\_configuration\_set\_name) | SES configuration set name |
| <a name="output_ses_domain_identity"></a> [ses\_domain\_identity](#output\_ses\_domain\_identity) | SES domain identity |
| <a name="output_ses_identity_arn"></a> [ses\_identity\_arn](#output\_ses\_identity\_arn) | SES email identity ARN |
| <a name="output_sns_topic_arn"></a> [sns\_topic\_arn](#output\_sns\_topic\_arn) | SNS topic ARN for GuardDuty notifications |
