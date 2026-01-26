resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/${var.environment}/application"
  retention_in_days = 7 #NOSONAR test environment with fake data
  kms_key_id        = data.terraform_remote_state.data.outputs.customer_kms_key_arn
  tags = {
    Name = "${local.name_prefix}-application-logs"
  }
}
resource "aws_cloudwatch_log_group" "system" {
  name              = "/aws/${var.environment}/system"
  retention_in_days = 7 #NOSONAR test environment with fake data
  kms_key_id        = data.terraform_remote_state.data.outputs.customer_kms_key_arn
  tags = {
    Name = "${local.name_prefix}-system-logs"
  }
}
