resource "aws_cloudtrail" "organization" {
  depends_on                    = [module.cloudtrail_bucket]
  name                          = "${var.org_name}-${var.project_name}-organization-trail"
  s3_bucket_name                = module.cloudtrail_bucket.s3_bucket_id
  is_multi_region_trail         = true
  is_organization_trail         = true
  enable_log_file_validation    = true
  include_global_service_events = true
  kms_key_id                    = data.terraform_remote_state.bootstrap.outputs.org_kms_key_arn
  tags = {
    Name = "${var.org_name}-${var.project_name}-organization-trail"
  }
}
