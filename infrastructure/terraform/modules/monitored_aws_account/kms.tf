data "aws_iam_policy_document" "sns_encryption_key_policy_document" {

  statement {
    sid = "Enable IAM User Permissions"
    principals {
      type        = "AWS"
      identifiers = [ "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" ]
    }
    actions = [
      "kms:ReplicateKey",
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion"
    ]
    resources = [ aws_kms_key.sns_encryption_key.arn ]
  }
  statement {
    sid       = "AllowBudgetsToEncrypt"
    actions = [ "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*" ]
    effect    = "Allow"
    resources = [ aws_kms_key.sns_encryption_key.arn ]
    principals {
      type        = "Service"
      identifiers = [ "budgets.amazonaws.com" ]
    }
  }
}

resource "aws_kms_key" "sns_encryption_key" {
  description = "KMS key for encrypting SNS messages"
  deletion_window_in_days = 10
  enable_key_rotation = true
}

resource "aws_kms_key_policy" "sns_encryption_key_policy" {
  key_id = aws_kms_key.sns_encryption_key.id
  policy = data.aws_iam_policy_document.sns_encryption_key_policy_document.json
}
