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

output "sns_topic_arn" {
  description = "SNS topic ARN for GuardDuty notifications"
  value       = module.guardduty_notifications.topic_arn
}
