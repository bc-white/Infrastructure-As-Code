terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  required_version = "~> 1.9.0"
}

data "aws_caller_identity" "current" {}

resource "aws_sns_topic" "admin_notifications" {
  display_name = "Admin Notifications"
  kms_master_key_id = aws_kms_key.sns_encryption_key.arn
  name              = "admin-notifications"
}

resource "aws_sns_topic_policy" "admin_notifications_policy" {
  arn =  aws_sns_topic.admin_notifications.arn
  policy = data.aws_iam_policy_document.admin_notifications_policy.json
}

resource "aws_sns_topic_subscription" "email_admin_notifications_subscription" {
  for_each = toset(var.budget_alert_emails)
  topic_arn = aws_sns_topic.admin_notifications.arn
  protocol  = "email"
  endpoint  = each.value
}
