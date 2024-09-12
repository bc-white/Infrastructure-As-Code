terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
  required_version = "~> 1.9.0"
}

resource "aws_sns_topic" "admin_notifications" {
  display_name = "Admin Notifications"
  kms_master_key_id = "alias/aws/sns"
  name              = "admin-notifications"
}

resource "aws_sns_topic_subscription" "email_admin_notifications_subscription" {
  for_each = toset(var.budget_alert_emails)
  topic_arn = aws_sns_topic.admin_notifications.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic_subscription" "sms_admin_notifications_subscription" {
  for_each = toset(var.budget_alert_phone_numbers)
  topic_arn = aws_sns_topic.admin_notifications.arn
  protocol  = "sms"
  endpoint  = each.value
}
