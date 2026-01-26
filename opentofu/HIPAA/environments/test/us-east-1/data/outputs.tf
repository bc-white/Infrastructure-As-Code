output "customer_kms_key_arn" {
  description = "Customer data KMS key ARN"
  value       = aws_kms_key.customer_data.arn
}

output "customer_kms_key_id" {
  description = "Customer data KMS key ID"
  value       = aws_kms_key.customer_data.key_id
}

output "uploads_bucket_arn" {
  description = "Uploads bucket ARN"
  value       = module.uploads_bucket.s3_bucket_arn
}

output "uploads_bucket_name" {
  description = "Uploads bucket name"
  value       = module.uploads_bucket.s3_bucket_id
}
