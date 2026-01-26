resource "aws_guardduty_organization_admin_account" "main" {
  admin_account_id = data.aws_caller_identity.current.account_id
}

resource "aws_guardduty_organization_configuration" "primary" {
  detector_id                      = aws_guardduty_detector.primary.id
  auto_enable_organization_members = "ALL"

  depends_on = [aws_guardduty_organization_admin_account.main]
}

resource "aws_guardduty_organization_configuration_feature" "s3_primary" {
  detector_id = aws_guardduty_detector.primary.id
  name        = "S3_DATA_EVENTS"
  auto_enable = "ALL"

  depends_on = [aws_guardduty_organization_configuration.primary]
}

resource "aws_guardduty_organization_configuration_feature" "ebs_malware_primary" {
  detector_id = aws_guardduty_detector.primary.id
  name        = "EBS_MALWARE_PROTECTION"
  auto_enable = "ALL"

  depends_on = [aws_guardduty_organization_configuration.primary]
}
