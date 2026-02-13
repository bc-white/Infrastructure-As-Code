output "artifacts_bucket_arn" {
  description = "Artifacts bucket ARN"
  value       = module.artifacts_bucket.s3_bucket_arn
}

output "artifacts_bucket_name" {
  description = "Artifacts bucket name"
  value       = module.artifacts_bucket.s3_bucket_id
}

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

output "jwt_secret_arn" {
  description = "JWT secret ARN"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "redis_auth_token_secret_arn" {
  description = "Redis auth token secret ARN"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

output "uploads_bucket_arn" {
  description = "Uploads bucket ARN"
  value       = module.uploads_bucket.s3_bucket_arn
}

output "uploads_bucket_name" {
  description = "Uploads bucket name"
  value       = module.uploads_bucket.s3_bucket_id
}
