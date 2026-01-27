data "aws_iam_policy_document" "kms_key_policy" {
  statement {
    sid = "Enable IAM policies for grants and data access"
    actions = [
      "kms:CreateGrant",
      "kms:ListGrants",
      "kms:RevokeGrant",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
  statement {
    sid = "Allow IAM Identity Center admins"
    actions = [
      "kms:*"
    ]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.admin_role_name}"]
    }
  }
  statement {
    sid = "Allow S3 to use the key"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
  }
  statement {
    sid = "Allow CloudWatch Logs to use the key"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:ReEncrypt*"
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["logs.${var.region}.amazonaws.com"]
    }
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"]
    }
  }
}

resource "aws_kms_key" "customer_data" {
  description             = "Customer data encryption key for ${var.environment} environment"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags = {
    Name = "${local.name_prefix}-customer-data-key"
  }
}

resource "aws_kms_alias" "customer_data" {
  name          = "alias/${local.name_prefix}/customer-data"
  target_key_id = aws_kms_key.customer_data.key_id
}

resource "aws_kms_key_policy" "customer_data" {
  key_id = aws_kms_key.customer_data.id
  policy = data.aws_iam_policy_document.kms_key_policy.json
}
