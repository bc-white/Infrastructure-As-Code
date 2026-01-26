resource "aws_kms_key" "org_primary" {
  description             = "${var.org_name}-${var.project_name} organization primary multi-region key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  multi_region            = true
  policy                  = data.aws_iam_policy_document.kms_org_key.json
  tags = {
    Name = "${var.org_name}-${var.project_name}-org-primary-key"
  }
}

resource "aws_kms_alias" "org_primary" {
  name          = "alias/${var.org_name}-${var.project_name}/org-primary"
  target_key_id = aws_kms_key.org_primary.key_id
}

resource "aws_kms_replica_key" "org_dr" {
  provider = aws.dr
  description             = "${var.org_name}-${var.project_name} organization DR multi-region key replica"
  deletion_window_in_days = 30
  primary_key_arn         = aws_kms_key.org_primary.arn
  policy                  = data.aws_iam_policy_document.kms_org_key.json
  tags = {
    Name = "${var.org_name}-${var.project_name}-org-dr-key"
  }
}

resource "aws_kms_alias" "org_dr" {
  provider = aws.dr
  name          = "alias/${var.org_name}-${var.project_name}/org-dr"
  target_key_id = aws_kms_replica_key.org_dr.key_id
}
