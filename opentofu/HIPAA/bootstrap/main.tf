resource "random_id" "bucket_suffix" {
  byte_length = 4
}

module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"
  bucket = "${var.org_name}-${var.project_name}-tofu-state-${random_id.bucket_suffix.hex}"
  force_destroy = false
  versioning = {
    enabled = var.enable_versioning
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
  attach_deny_insecure_transport_policy = true

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
    target_bucket = module.s3_access_logs.s3_bucket_id
    target_prefix = "state-bucket/"
  }
  tags = {
    Name = "${var.org_name}-${var.project_name}-tofu-state-${random_id.bucket_suffix.hex}"
  }
}

module "s3_access_logs" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"
  bucket  = "${var.org_name}-${var.project_name}-s3-access-logs"
  force_destroy = false

  versioning = {
    enabled = true
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.org_primary.arn
      }
      bucket_key_enabled = true
    }
  }
  attach_deny_insecure_transport_policy = true
  attach_elb_log_delivery_policy        = false
  attach_lb_log_delivery_policy         = false
  attach_access_log_delivery_policy     = true
  acl                     = "log-delivery-write"
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  lifecycle_rule = [
    {
      id      = "hipaa-compliant-retention"
      enabled = true
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        },
        {
          days          = 365
          storage_class = "GLACIER_IR"
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

  replication_configuration = {
    role = aws_iam_role.s3_replication.arn
    rules = [
      {
        id       = "replicate-to-dr"
        status   = "Enabled"
        priority = 10
        delete_marker_replication = true
        destination = {
          bucket        = module.s3_access_logs_dr.s3_bucket_arn
          storage_class = "STANDARD"
        }
      }
    ]
  }
  tags = {
    Name = "${var.org_name}-${var.project_name}-s3-access-logs"
  }
}

module "s3_access_logs_dr" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"
  providers = {
    aws = aws.dr
  }
  bucket = "${var.org_name}-${var.project_name}-s3-access-logs-dr"
  force_destroy = false
  versioning = {
    enabled = true
  }
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_replica_key.org_dr.arn
      }
      bucket_key_enabled = true
    }
  }
  attach_deny_insecure_transport_policy = true
  acl                                   = "private"
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true
  lifecycle_rule = [
    {
      id      = "hipaa-compliant-retention"
      enabled = true
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        },
        {
          days          = 365
          storage_class = "GLACIER_IR"
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
    Name = "${var.org_name}-${var.project_name}-s3-access-logs-dr"
  }
}
