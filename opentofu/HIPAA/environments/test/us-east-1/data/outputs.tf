output "customer_kms_key_arn" {
  description = "Customer data KMS key ARN"
  value       = aws_kms_key.customer_data.arn
}

output "customer_kms_key_id" {
  description = "Customer data KMS key ID"
  value       = aws_kms_key.customer_data.key_id
}

output "ec2_instance_profile_arn" {
  description = "EC2 instance profile ARN"
  value       = aws_iam_instance_profile.ec2.arn
}

output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = aws_iam_instance_profile.ec2.name
}

output "ec2_role_arn" {
  description = "EC2 IAM role ARN"
  value       = aws_iam_role.ec2_instance.arn
}

output "ec2_role_name" {
  description = "EC2 IAM role name"
  value       = aws_iam_role.ec2_instance.name
}

output "uploads_bucket_arn" {
  description = "Uploads bucket ARN"
  value       = module.uploads_bucket.s3_bucket_arn
}

output "uploads_bucket_name" {
  description = "Uploads bucket name"
  value       = module.uploads_bucket.s3_bucket_id
}
