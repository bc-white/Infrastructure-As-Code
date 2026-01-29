data "aws_iam_policy_document" "dnssec_kms_policy" {
  statement {
    sid    = "Enable IAM policies"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions = [
      "kms:*"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "Allow Route 53 DNSSEC Service"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["dnssec-route53.amazonaws.com"]
    }
    actions = [
      "kms:DescribeKey",
      "kms:GetPublicKey",
      "kms:Sign"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "Allow Route 53 DNSSEC to create grant"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["dnssec-route53.amazonaws.com"]
    }
    actions = [
      "kms:CreateGrant"
    ]
    resources = ["*"]
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}

resource "aws_route53_zone" "primary" {
  name = var.domain_name
  tags = {
    Name = "${var.org_name}-${var.project_name}-hosted-zone"
  }
}

resource "aws_kms_key" "dnssec" {
  customer_master_key_spec = "ECC_NIST_P256"
  deletion_window_in_days  = 30
  key_usage                = "SIGN_VERIFY"
  policy                   = data.aws_iam_policy_document.dnssec_kms_policy.json
  tags = {
    Name = "${var.org_name}-${var.project_name}-dnssec-key"
  }
}

resource "aws_kms_alias" "dnssec" {
  name          = "alias/${var.org_name}-${var.project_name}/dnssec"
  target_key_id = aws_kms_key.dnssec.key_id
}

resource "aws_route53_key_signing_key" "primary" {
  hosted_zone_id             = aws_route53_zone.primary.zone_id
  key_management_service_arn = aws_kms_key.dnssec.arn
  name                       = var.domain_name
}

resource "aws_route53_hosted_zone_dnssec" "primary" {
  hosted_zone_id = aws_route53_key_signing_key.primary.hosted_zone_id
}
