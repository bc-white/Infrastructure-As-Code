module "guardduty_notifications" {
  source            = "terraform-aws-modules/sns/aws"
  version           = "~> 7.1"
  name              = "${var.org_name}-${var.project_name}-guardduty-notifications"
  kms_master_key_id = data.terraform_remote_state.bootstrap.outputs.org_kms_key_id
  topic_policy_statements = {
    eventbridge_publish = {
      sid = "AllowEventBridgeToPublish"
      actions = [
        "SNS:Publish",
      ]
      principals = [
        {
          type        = "Service"
          identifiers = ["events.amazonaws.com"]
        }
      ]
      condition = [
        {
          test     = "StringEquals"
          variable = "aws:SourceAccount"
          values   = [data.aws_caller_identity.current.account_id]
        }
      ]
    }
  }
  subscriptions = {
    for idx, email in var.notification_emails : "email-${idx}" => {
      protocol = "email"
      endpoint = email
    }
  }
  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-notifications"
  }
}
