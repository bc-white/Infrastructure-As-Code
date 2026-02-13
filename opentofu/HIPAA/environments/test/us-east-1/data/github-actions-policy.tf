data "aws_iam_policy_document" "github_actions_artifacts" {
  statement {
    sid = "AllowArtifactsUpload"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      module.artifacts_bucket.s3_bucket_arn,
      "${module.artifacts_bucket.s3_bucket_arn}/*"
    ]
  }
  statement {
    sid = "AllowKMSEncryption"
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]
    resources = [data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn]
  }
}
resource "aws_iam_policy" "github_actions_artifacts" {
  name        = "${local.name_prefix}-github-actions-artifacts"
  description = "Allow GitHub Actions to upload artifacts to S3 for ${var.environment}"
  policy      = data.aws_iam_policy_document.github_actions_artifacts.json
}
resource "aws_iam_role_policy_attachment" "github_actions_artifacts" {
  role       = split("/", data.terraform_remote_state.organization.outputs.github_actions_role_arn)[1]
  policy_arn = aws_iam_policy.github_actions_artifacts.arn
}
