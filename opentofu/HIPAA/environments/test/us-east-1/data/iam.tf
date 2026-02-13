data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "ec2_instance" {
  name_prefix        = "${local.name_prefix}-ec2-"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags = {
    Name = "${local.name_prefix}-ec2-role"
  }
}
data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid = "S3Access"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      module.uploads_bucket.s3_bucket_arn,
      "${module.uploads_bucket.s3_bucket_arn}/*",
      module.artifacts_bucket.s3_bucket_arn,
      "${module.artifacts_bucket.s3_bucket_arn}/*"
    ]
  }
  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/${var.org_name}/${var.project_name}/${var.environment}/*"]
  }
  statement {
    sid = "CloudWatchMetrics"
    actions = [
      "cloudwatch:PutMetricData"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["MockSurvey365/${var.environment}"]
    }
  }
  statement {
    sid = "SSMSessionManager"
    actions = [
      "ssm:UpdateInstanceInformation",
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel"
    ]
    resources = ["*"]
  }
  statement {
    sid = "KMSAccess"
    actions = [
      "kms:CreateGrant",
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey*",
      "kms:ReEncrypt*"
    ]
    resources = [aws_kms_key.customer_data.arn]
  }
  statement {
    sid = "SecretsManagerAccess"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = ["arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:${var.environment}/${var.org_name}/${var.project_name}/*"]
  }
  statement {
    sid = "ParameterStoreAccess"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters"
    ]
    resources = ["arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment}/${var.org_name}/${var.project_name}/*"]
  }
}
resource "aws_iam_policy" "ec2_permissions" {
  name_prefix = "${local.name_prefix}-ec2-"
  policy      = data.aws_iam_policy_document.ec2_permissions.json
}
resource "aws_iam_role_policy_attachment" "ec2_permissions" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = aws_iam_policy.ec2_permissions.arn
}
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  role        = aws_iam_role.ec2_instance.name
}
