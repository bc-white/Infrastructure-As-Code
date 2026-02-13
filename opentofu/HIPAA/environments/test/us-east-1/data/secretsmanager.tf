resource "random_password" "redis_auth_token" {
  length           = 32
  special          = true
  override_special = "!&#$^<>-"
}
resource "aws_secretsmanager_secret" "redis_auth_token" {
  name                    = "${var.environment}/${var.org_name}/${var.project_name}/redis-auth-token"
  description             = "Redis authentication token for ${var.environment} environment"
  kms_key_id              = aws_kms_key.customer_data.arn
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
  tags = {
    Name = "${local.name_prefix}-redis-auth-token"
  }
}
resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis_auth_token.result
}
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.environment}/${var.org_name}/${var.project_name}/jwt-secret"
  description             = "JWT secret for ${var.environment} environment"
  kms_key_id              = aws_kms_key.customer_data.arn
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
  tags = {
    Name = "${local.name_prefix}-jwt-secret"
  }
}
resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}
