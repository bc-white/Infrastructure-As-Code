module "guardduty_findings_bucket" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "~> 5.0"
  bucket        = "${var.org_name}-${var.project_name}-guardduty-findings"
  force_destroy = false
  versioning = {
    enabled = true
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
      }
      bucket_key_enabled = true
    }
  }
  attach_deny_insecure_transport_policy = true
  attach_policy                         = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowGuardDutyGetBucketLocation"
        Effect = "Allow"
        Principal = {
          Service = "guardduty.amazonaws.com"
        }
        Action   = "s3:GetBucketLocation"
        Resource = "arn:aws:s3:::${var.org_name}-${var.project_name}-guardduty-findings"
      },
      {
        Sid    = "AllowGuardDutyPutObject"
        Effect = "Allow"
        Principal = {
          Service = "guardduty.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "arn:aws:s3:::${var.org_name}-${var.project_name}-guardduty-findings/*"
      }
    ]
  })

  logging = {
    target_bucket = data.terraform_remote_state.bootstrap.outputs.s3_access_logs_bucket_name
    target_prefix = "guardduty-findings/"
  }
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  lifecycle_rule = [
    {
      id      = "guardduty-findings-lifecycle"
      enabled = true
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        },
        {
          days          = 180
          storage_class = "GLACIER"
        }
      ]
      expiration = {
        days = 2190
      }
    }
  ]
  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-findings"
  }
}

module "cloudtrail_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket        = "${var.org_name}-${var.project_name}-cloudtrail-logs"
  force_destroy = false

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
      }
      bucket_key_enabled = true
    }
  }

  attach_deny_insecure_transport_policy = true
  attach_policy                         = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = "arn:aws:s3:::${var.org_name}-${var.project_name}-cloudtrail-logs"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.primary_region}:${data.aws_caller_identity.current.account_id}:trail/${var.org_name}-${var.project_name}-organization-trail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "arn:aws:s3:::${var.org_name}-${var.project_name}-cloudtrail-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.primary_region}:${data.aws_caller_identity.current.account_id}:trail/${var.org_name}-${var.project_name}-organization-trail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailOrganizationWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "arn:aws:s3:::${var.org_name}-${var.project_name}-cloudtrail-logs/AWSLogs/${data.aws_organizations_organization.current.id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.primary_region}:${data.aws_caller_identity.current.account_id}:trail/${var.org_name}-${var.project_name}-organization-trail"
          }
        }
      }
    ]
  })
  logging = {
    target_bucket = data.terraform_remote_state.bootstrap.outputs.s3_access_logs_bucket_name
    target_prefix = "cloudtrail-logs/"
  }
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  lifecycle_rule = [
    {
      id      = "cloudtrail-logs-lifecycle"
      enabled = true
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        },
        {
          days          = 365
          storage_class = "GLACIER"
        },
        {
          days          = 730
          storage_class = "DEEP_ARCHIVE"
        }
      ]
      expiration = {
        days = 2190
      }
    }
  ]
  tags = {
    Name = "${var.org_name}-${var.project_name}-cloudtrail-logs"
  }
}
