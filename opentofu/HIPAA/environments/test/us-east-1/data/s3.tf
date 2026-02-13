data "aws_iam_policy_document" "uploads_bucket_policy" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-uploads",
      "arn:aws:s3:::${local.name_prefix}-uploads/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
  statement {
    sid    = "AllowEC2InstanceRole"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ec2_instance.arn]
    }
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-uploads",
      "arn:aws:s3:::${local.name_prefix}-uploads/*"
    ]
  }
  statement {
    sid    = "AllowAdminFullAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.admin_role_name}"]
    }
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-uploads",
      "arn:aws:s3:::${local.name_prefix}-uploads/*"
    ]
  }
}

module "uploads_bucket" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "~> 5.0"
  bucket        = "${local.name_prefix}-uploads"
  force_destroy = false
  versioning = {
    enabled = true
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.customer_data.arn
      }
    }
  }
  attach_policy           = true
  policy                  = data.aws_iam_policy_document.uploads_bucket_policy.json
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  lifecycle_rule = [
    {
      id      = "expire-old-versions"
      enabled = true
      noncurrent_version_expiration = {
        days = 90
      }
    }
  ]
  logging = {
    target_bucket = data.terraform_remote_state.bootstrap.outputs.s3_access_logs_bucket_name
    target_prefix = "uploads-${var.environment}/"
  }
  tags = {
    Name = "${local.name_prefix}-uploads"
  }
}

data "aws_iam_policy_document" "artifacts_bucket_policy" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-artifacts",
      "arn:aws:s3:::${local.name_prefix}-artifacts/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
  statement {
    sid    = "AllowEC2InstanceRole"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.ec2_instance.arn]
    }
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-artifacts",
      "arn:aws:s3:::${local.name_prefix}-artifacts/*"
    ]
  }
  statement {
    sid    = "AllowAdminFullAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.admin_role_name}"]
    }
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${local.name_prefix}-artifacts",
      "arn:aws:s3:::${local.name_prefix}-artifacts/*"
    ]
  }
}

module "artifacts_bucket" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "~> 5.0"
  bucket        = "${local.name_prefix}-artifacts"
  force_destroy = var.environment == "prod" ? false : true
  versioning = {
    enabled = true
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
      }
    }
  }
  attach_policy           = true
  policy                  = data.aws_iam_policy_document.artifacts_bucket_policy.json
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  lifecycle_rule = [
    {
      id      = "expire-old-versions"
      enabled = true
      noncurrent_version_expiration = {
        days = var.environment == "prod" ? 90 : 30
      }
    },
    {
      id                                     = "abort-incomplete-multipart"
      enabled                                = true
      abort_incomplete_multipart_upload_days = 7
    }
  ]
  logging = {
    target_bucket = data.terraform_remote_state.bootstrap.outputs.s3_access_logs_bucket_name
    target_prefix = "artifacts-${var.environment}/"
  }
  tags = {
    Name = "${local.name_prefix}-artifacts"
  }
}
