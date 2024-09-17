

data "aws_iam_policy_document" "s3_endpoint_policy_document" {

  statement {
    sid = "Enable IAM User Permissions - S3"
    principals {
      type        = "AWS"
      identifiers = [ aws_iam_group.aws_console_access.arn ]
    }
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:listBucket",
      "s3:ListObjects"
    ]
    resources = [ aws_vpc_endpoint.s3_endpoint.arn ]
  }
}

# resource "aws_default_vpc" "default_vpc" {
#     tags = {
#         Name = "Default VPC"
#     }
# }

# resource "aws_vpc_endpoint" "s3_endpoint" {
#     vpc_id = aws_default_vpc.default_vpc.id
#     service_name = "com.amazonaws.${var.region}.s3"  
# }
