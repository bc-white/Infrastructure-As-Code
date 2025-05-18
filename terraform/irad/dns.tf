data "aws_iam_policy_document" "route_53_ksk_policy" {
    statement {
        sid = "Enable IAM User Permissions"
        principals {
            type        = "AWS"
            identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        actions   = [ "kms:*" ]
        resources = [ aws_kms_key.route_53_ksk_kms_key.arn ]
    }
    statement {
        sid = "Allow Route 53 DNSSEC Service"
        principals {
            type        = "Service"
            identifiers = ["dnssec-route53.amazonaws.com"]
        }
        actions = [
            "kms:DescribeKey",
            "kms:GetPublicKey",
            "kms:Sign"
        ]
        resources = [ aws_kms_key.route_53_ksk_kms_key.arn ]
        condition {
            test     = "StringEquals"
            variable = "aws:SourceAccount"
            values   = [data.aws_caller_identity.current.account_id]
        }
        condition {
            test     = "ArnLike"
            variable = "aws:SourceArn"
            values   = ["arn:aws:route53:::hostedzone/*"]
        }
    }
    statement {
        sid = "Allow Route 53 DNSSEC Service to CreateGrant"
        principals {
            type        = "Service"
            identifiers = ["dnssec-route53.amazonaws.com"]
        }
        actions   = [ "kms:CreateGrant" ]
        resources = [ aws_kms_key.route_53_ksk_kms_key.arn ]
        condition {
            test     = "Bool"
            variable = "kms:GrantIsForAWSResource"
            values   = ["true"]
        }
    }
}

module "r53_zones" {
    source    = "terraform-aws-modules/route53/aws//modules/zones"
    zones     = {
        "bogartlab.com" = {
            comment = "bogartlab.com DNS zone"
        }
    }
}

module "certificate_manager" {
    source  = "terraform-aws-modules/acm/aws"
    domain_name  = "bogartlab.com"
    zone_id      = module.r53_zones.route53_zone_zone_id["bogartlab.com"]
    validation_method = "DNS"
    wait_for_validation = false
    tags = {
        Name = "bogartlab.com"
    }
}

# module "r53_records" {
#     source    = "terraform-aws-modules/route53/aws//modules/records"
#     zone_name = keys(module.r53_zones.route53_zone_zone_id)[0]
#     depends_on = [module.zones]
#     records = []
# }

resource "aws_kms_key" "route_53_ksk_kms_key" {
    customer_master_key_spec = "ECC_NIST_P256"
    description = "KMS key for Route 53 KSK"
    deletion_window_in_days = 7
    key_usage = "SIGN_VERIFY"
    tags = {
        Name = "Route 53 KSK KMS Key"
        Environment = "prod"
        Terraform = "true"
        Account = "IRAD"
    }
}

resource "aws_kms_alias" "route_53_ksk_kms_key" {
    name          = "alias/route-53-ksk-key"
    target_key_id = aws_kms_key.route_53_ksk_kms_key.key_id
}

resource "aws_kms_key_policy" "route_53_ksk_kms_key_policy_attachment" {
    key_id = aws_kms_key.route_53_ksk_kms_key.id
    policy = data.aws_iam_policy_document.route_53_ksk_policy.json
}