module "uploads_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"
  bucket = "${local.name_prefix}-uploads"
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
  attach_deny_insecure_transport_policy = true
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
