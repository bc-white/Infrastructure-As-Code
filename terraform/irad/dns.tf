module "r53_zones" {
    source    = "terraform-aws-modules/route53/aws//modules/zones"
    zones     = {
        "bogartlab.com" = {
            comment = "bogartlab.com DNS zone"
        }
    }
}

# module "r53_records" {
#     source    = "terraform-aws-modules/route53/aws//modules/records"
#     zone_name = keys(module.r53_zones.route53_zone_zone_id)[0]
#     depends_on = [module.zones]
#     records = []
# }

resource "aws_kms_key" "route_53_ksk_kms_key" {
    description = "KMS key for Route 53 KSK"
    deletion_window_in_days = 7
    enable_key_rotation = true
    tags = {
        Name = "Route 53 KSK KMS Key"
        Environment = "prod"
        Terraform = "true"
        Account = "IRAD"
    }
}