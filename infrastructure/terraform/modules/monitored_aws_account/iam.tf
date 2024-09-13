data "aws_iam_policy_document" "admin_notifications_policy" {
  statement {
    sid       = "AllowBudgetsToNotify"
    actions = [ "SNS:Publish"]
    effect    = "Allow"
    resources = [ aws_sns_topic.admin_notifications.arn ]
    principals {
      type        = "Service"
      identifiers = [ "budgets.amazonaws.com" ]
    }
  }

  statement {
    sid      = "Prevent Unencrypted Traffic"
    actions  = [ "SNS:Publish" ]
    effect   = "Deny"
    resources = [ aws_sns_topic.admin_notifications.arn ]
    principals {
      type        = "AWS"
      identifiers = [ "*" ]
    }
    condition {
        test     = "Bool"
        variable = "sns:Encrypted"
        values   = [ "false" ]
    }
  }
}

resource "aws_iam_group" "aws_console_access" {
  name = "aws_console_access"
}

module "enforce_mfa" {
  source  = "terraform-module/enforce-mfa/aws"
  version = "~> 1.0"
  policy_name                     = "managed-mfa-enforce"
  account_id                      = data.aws_caller_identity.current.id
  groups                          = [aws_iam_group.aws_console_access.name]
  manage_own_ssh_public_keys      = true
}

resource "aws_iam_account_password_policy" "password_policy" {
  allow_users_to_change_password    = true
  max_password_age                  = 60
  minimum_password_length           = 14
  require_lowercase_characters      = true
  require_numbers                   = true
  require_uppercase_characters      = true
  require_symbols                   = true
}

resource "aws_iam_group_policy_attachment" "enforce_mfa_attachment" {
  group      = aws_iam_group.aws_console_access.name
  policy_arn = module.enforce_mfa.id
}
