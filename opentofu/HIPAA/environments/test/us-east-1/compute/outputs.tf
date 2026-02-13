output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.wildcard.arn
}

output "application_log_group_arn" {
  description = "Application log group ARN"
  value       = aws_cloudwatch_log_group.application.arn
}

output "application_log_group_name" {
  description = "Application log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "system_log_group_arn" {
  description = "System log group ARN"
  value       = aws_cloudwatch_log_group.system.arn
}

output "system_log_group_name" {
  description = "System log group name"
  value       = aws_cloudwatch_log_group.system.name
}

output "target_group_api_arn" {
  description = "API target group ARN"
  value       = aws_lb_target_group.api.arn
}

output "target_group_app_arn" {
  description = "App target group ARN"
  value       = aws_lb_target_group.app.arn
}

output "target_group_portal_arn" {
  description = "Portal target group ARN"
  value       = aws_lb_target_group.portal.arn
}

output "target_group_seniorliving_arn" {
  description = "SeniorLiving target group ARN"
  value       = aws_lb_target_group.seniorliving.arn
}
