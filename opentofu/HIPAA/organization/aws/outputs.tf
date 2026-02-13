output "cloudtrail_arn" {
  description = "CloudTrail trail ARN"
  value       = aws_cloudtrail.organization.arn
}

output "cloudtrail_bucket_arn" {
  description = "S3 bucket ARN for CloudTrail logs"
  value       = module.cloudtrail_bucket.s3_bucket_arn
}

output "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  value       = module.cloudtrail_bucket.s3_bucket_id
}

output "cloudtrail_id" {
  description = "CloudTrail trail ID"
  value       = aws_cloudtrail.organization.id
}

output "eventbridge_rule_dr" {
  description = "EventBridge rule name in DR region"
  value       = aws_cloudwatch_event_rule.guardduty_findings_dr.name
}

output "eventbridge_rule_primary" {
  description = "EventBridge rule name in primary region"
  value       = aws_cloudwatch_event_rule.guardduty_findings_primary.name
}
output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "findings_bucket_arn" {
  description = "S3 bucket ARN for GuardDuty findings"
  value       = module.guardduty_findings_bucket.s3_bucket_arn
}

output "findings_bucket_name" {
  description = "S3 bucket name for GuardDuty findings"
  value       = module.guardduty_findings_bucket.s3_bucket_id
}

output "guardduty_detector_id_dr" {
  description = "GuardDuty detector ID in DR region"
  value       = aws_guardduty_detector.dr.id
}

output "guardduty_detector_id_primary" {
  description = "GuardDuty detector ID in primary region"
  value       = aws_guardduty_detector.primary.id
}

output "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.primary.zone_id
}

output "hosted_zone_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = aws_route53_zone.primary.name_servers
}

output "ses_configuration_set_name" {
  description = "SES configuration set name"
  value       = aws_sesv2_configuration_set.main.configuration_set_name
}

output "ses_domain_identity" {
  description = "SES domain identity"
  value       = aws_sesv2_email_identity.domain.email_identity
}

output "ses_identity_arn" {
  description = "SES email identity ARN"
  value       = aws_sesv2_email_identity.domain.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for GuardDuty notifications"
  value       = module.guardduty_notifications.topic_arn
}
