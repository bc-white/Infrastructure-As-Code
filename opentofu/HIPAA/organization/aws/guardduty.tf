resource "aws_guardduty_detector" "primary" {
  enable                       = true
  finding_publishing_frequency = var.guardduty_finding_publishing_frequency

  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-primary"
  }
}

resource "aws_guardduty_detector_feature" "s3_primary" {
  detector_id = aws_guardduty_detector.primary.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

resource "aws_guardduty_detector_feature" "ebs_malware_primary" {
  detector_id = aws_guardduty_detector.primary.id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

resource "aws_guardduty_publishing_destination" "primary" {
  detector_id     = aws_guardduty_detector.primary.id
  destination_arn = module.guardduty_findings_bucket.s3_bucket_arn
  kms_key_arn     = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
  depends_on      = [module.guardduty_findings_bucket]
}

resource "aws_guardduty_detector" "dr" {
  provider                     = aws.dr
  enable                       = true
  finding_publishing_frequency = var.guardduty_finding_publishing_frequency

  tags = {
    Name = "${var.org_name}-${var.project_name}-guardduty-dr"
  }
}

resource "aws_guardduty_detector_feature" "s3_dr" {
  provider    = aws.dr
  detector_id = aws_guardduty_detector.dr.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

resource "aws_guardduty_detector_feature" "ebs_malware_dr" {
  provider    = aws.dr
  detector_id = aws_guardduty_detector.dr.id
  name        = "EBS_MALWARE_PROTECTION"
  status      = "ENABLED"
}

resource "aws_guardduty_publishing_destination" "dr" {
  provider        = aws.dr
  detector_id     = aws_guardduty_detector.dr.id
  destination_arn = module.guardduty_findings_bucket.s3_bucket_arn
  kms_key_arn     = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
  depends_on      = [module.guardduty_findings_bucket]
}
