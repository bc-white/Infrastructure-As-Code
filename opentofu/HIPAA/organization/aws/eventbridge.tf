resource "aws_cloudwatch_event_rule" "guardduty_findings_primary" {
  name        = "${var.org_name}-${var.project_name}-guardduty-findings-primary"
  description = "Capture all GuardDuty findings in primary region"
  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })
  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-findings-primary"
  }
}

resource "aws_cloudwatch_event_rule" "guardduty_findings_dr" {
  provider    = aws.dr
  name        = "${var.org_name}-${var.project_name}-guardduty-findings-dr"
  description = "Capture all GuardDuty findings in DR region"
  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })
  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-findings-dr"
  }
}

resource "aws_cloudwatch_event_target" "sns_primary" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings_primary.name
  target_id = "SendToSNS"
  arn       = module.guardduty_notifications.topic_arn
  input_transformer {
    input_paths = {
      severity    = "$.detail.severity"
      type        = "$.detail.type"
      region      = "$.region"
      accountId   = "$.account"
      time        = "$.time"
      title       = "$.detail.title"
      description = "$.detail.description"
    }
    input_template = <<-EOF
      {
        "Alert": "GuardDuty Finding",
        "Severity": <severity>,
        "Type": <type>,
        "Region": <region>,
        "Account": <accountId>,
        "Time": <time>,
        "Title": <title>,
        "Description": <description>
      }
    EOF
  }
}

resource "aws_cloudwatch_event_target" "sns_dr" {
  provider  = aws.dr
  rule      = aws_cloudwatch_event_rule.guardduty_findings_dr.name
  target_id = "SendToSNS"
  arn       = module.guardduty_notifications.topic_arn

  input_transformer {
    input_paths = {
      severity    = "$.detail.severity"
      type        = "$.detail.type"
      region      = "$.region"
      accountId   = "$.account"
      time        = "$.time"
      title       = "$.detail.title"
      description = "$.detail.description"
    }

    input_template = <<-EOF
      {
        "Alert": "GuardDuty Finding",
        "Severity": <severity>,
        "Type": <type>,
        "Region": <region>,
        "Account": <accountId>,
        "Time": <time>,
        "Title": <title>,
        "Description": <description>
      }
    EOF
  }
}
