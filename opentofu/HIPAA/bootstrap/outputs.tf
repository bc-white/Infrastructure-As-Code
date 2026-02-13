output "state_bucket_name" {
  description = "Name of the S3 bucket for OpenTofu state"
  value       = module.s3_bucket.s3_bucket_id
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket for OpenTofu state"
  value       = module.s3_bucket.s3_bucket_arn
}

output "backend_config" {
  description = "Backend configuration to use in other OpenTofu configurations"
  value = {
    bucket  = module.s3_bucket.s3_bucket_id
    key     = "path/to/terraform.tfstate"
    region  = var.primary_region
    encrypt = true
  }
}

output "org_kms_key_id" {
  description = "Organization KMS key ID (same in both regions)"
  value       = aws_kms_key.org_primary.key_id
}

output "org_kms_key_arn" {
  description = "Organization KMS key ARN (same in both regions)"
  value       = aws_kms_key.org_primary.arn
}

output "org_kms_key_alias" {
  description = "Organization KMS key alias"
  value       = aws_kms_alias.org_primary.name
}

output "s3_access_logs_bucket_name" {
  description = "S3 access logs bucket name"
  value       = module.s3_access_logs.s3_bucket_id
}

output "s3_access_logs_bucket_arn" {
  description = "S3 access logs bucket ARN"
  value       = module.s3_access_logs.s3_bucket_arn
}

output "s3_access_logs_dr_bucket_name" {
  description = "S3 access logs DR bucket name"
  value       = module.s3_access_logs_dr.s3_bucket_id
}

output "s3_access_logs_dr_bucket_arn" {
  description = "S3 access logs DR bucket ARN"
  value       = module.s3_access_logs_dr.s3_bucket_arn
}
