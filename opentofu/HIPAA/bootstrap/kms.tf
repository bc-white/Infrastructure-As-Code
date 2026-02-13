data "aws_iam_policy_document" "kms_org_key" {
  statement {
    sid    = "Enable IAM Admin Permissions"
    effect = "Allow"
    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.admin_role_name}"
      ]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }
  statement {
    sid    = "Allow CloudTrail to decrypt and describe key"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "Allow CloudTrail to encrypt logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["kms:GenerateDataKey*"]
    resources = ["*"]
    condition {
      test     = "StringLike"
      variable = "kms:EncryptionContext:aws:cloudtrail:arn"
      values = [
        "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
      ]
    }
  }
  statement {
    sid    = "Allow services to use the key"
    effect = "Allow"
    principals {
      type = "Service"
      identifiers = [
        "events.amazonaws.com",
        "guardduty.amazonaws.com",
        "s3.amazonaws.com",
        "sns.amazonaws.com"
      ]
    }
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:GenerateDataKey"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "Allow IAM roles to use the key"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions = [
      "kms:Decrypt",
      "kms:DescryptKey",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKey*",
      "kms:ReEncrypt*",
      "kms:CreateGrant",
      "kms:DescribeKey"
    ]
    resources = ["*"]
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["s3.*.amazonaws.com"]
    }
  }
}

resource "aws_kms_key" "org_primary" {
  description             = "${var.org_name}-${var.project_name} organization primary multi-region key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  multi_region            = true
  policy                  = data.aws_iam_policy_document.kms_org_key.json
  tags = {
    Name = "${var.org_name}-${var.project_name}-org-primary-key"
  }
}

resource "aws_kms_alias" "org_primary" {
  name          = "alias/${var.org_name}-${var.project_name}/org-primary"
  target_key_id = aws_kms_key.org_primary.key_id
}

resource "aws_kms_replica_key" "org_dr" {
  provider                = aws.dr
  description             = "${var.org_name}-${var.project_name} organization DR multi-region key replica"
  deletion_window_in_days = 30
  primary_key_arn         = aws_kms_key.org_primary.arn
  policy                  = data.aws_iam_policy_document.kms_org_key.json
  tags = {
    Name = "${var.org_name}-${var.project_name}-org-dr-key"
  }
}

resource "aws_kms_alias" "org_dr" {
  provider      = aws.dr
  name          = "alias/${var.org_name}-${var.project_name}/org-dr"
  target_key_id = aws_kms_replica_key.org_dr.key_id
}
