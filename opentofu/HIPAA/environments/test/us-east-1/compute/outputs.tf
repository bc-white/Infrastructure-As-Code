output "lb_arn" {
  description = "Load balancer ARN"
  value       = aws_lb.main.arn
}

output "lb_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
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

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.main.arn
}
