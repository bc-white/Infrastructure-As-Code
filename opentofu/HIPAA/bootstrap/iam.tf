data "aws_iam_policy_document" "kms_org_key" {
  statement {
    sid    = "Enable IAM Admin Permissions"
    effect = "Allow"
    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.primary_region}/${var.admin_role_name}"
      ]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }
  statement {
    sid    = "Allow CloudTrail to encrypt logs"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "kms:GenerateDataKey*",
      "kms:DecryptDataKey"
    ]
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
    sid    = "Allow CloudTrail to describe key"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["kms:DescribeKey"]
    resources = ["*"]
  }
  statement {
    sid    = "Allow services to use the key"
    effect = "Allow"
    principals {
      type = "Service"
      identifiers = [
        "s3.amazonaws.com",
        "sns.amazonaws.com",
        "events.amazonaws.com"
      ]
    }
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "s3_replication_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "s3_replication" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetReplicationConfiguration",
      "s3:ListBucket"
    ]
    resources = [module.s3_access_logs.s3_bucket_arn]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObjectVersionForReplication",
      "s3:GetObjectVersionAcl",
      "s3:GetObjectVersionTagging"
    ]
    resources = ["${module.s3_access_logs.s3_bucket_arn}/*"]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:ReplicateObject",
      "s3:ReplicateDelete",
      "s3:ReplicateTags"
    ]
    resources = ["${module.s3_access_logs_dr.s3_bucket_arn}/*"]
  }
  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    resources = [aws_kms_key.org_primary.arn]
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["s3.${var.primary_region}.amazonaws.com"]
    }
  }
  statement {
    effect = "Allow"
    actions = [
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]
    resources = [aws_kms_key.org_primary.arn]
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["s3.${var.dr_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "s3_replication" {
  name               = "${var.org_name}-${var.project_name}-s3-replication"
  assume_role_policy = data.aws_iam_policy_document.s3_replication_assume.json
}

resource "aws_iam_policy" "s3_replication" {
  name   = "${var.org_name}-${var.project_name}-s3-replication"
  policy = data.aws_iam_policy_document.s3_replication.json
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}
