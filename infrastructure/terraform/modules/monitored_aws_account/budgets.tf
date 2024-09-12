resource "aws_budgets_budget" "daily_budget" {
  name              = "daily-budget"
  budget_type       = "COST"
  limit_amount      = var.budget_amount_daily
  limit_unit        = "USD"
  time_period_start = "2024-01-01_00:00"
  time_unit         = "DAILY"
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = var.budget_alert_threshold_daily
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns = [ aws_sns_topic.admin_notifications.arn ]
  }
}

resource "aws_budgets_budget" "monthly_budget" {
  name              = "monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.budget_amount_monthly
  limit_unit        = "USD"
  time_period_start = "2021-01-01_00:00"
  time_unit         = "MONTHLY"
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = var.budget_alert_threshold_monthly
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_sns_topic_arns = [ aws_sns_topic.admin_notifications.arn ]
  }
}
