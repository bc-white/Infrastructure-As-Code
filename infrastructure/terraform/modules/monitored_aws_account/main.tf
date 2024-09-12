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
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid: "Allow Budget Connections To SNS",
        Effect = "Allow"
        Principal = "*"
        Action = "sns:Publish"
        Resource = "arn:aws:sns:${data.aws_caller_identity.current.id}:${data.aws_caller_identity.current.id}:*"
        Condition = {
          StringEquals = {
            "AWS:SourceOwner" = data.aws_caller_identity.current.account_id
          },
          "ArnLike": {
            "aws:SourceArn": "arn:aws:budgets::${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email_admin_notifications_subscription" {
  for_each = toset(var.budget_alert_emails)
  topic_arn = aws_sns_topic.admin_notifications.arn
  protocol  = "email"
  endpoint  = each.value
}
