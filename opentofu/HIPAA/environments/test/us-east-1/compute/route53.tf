resource "aws_route53_record" "api" {
  zone_id = data.terraform_remote_state.organization.outputs.hosted_zone_id
  name    = "api${var.environment}.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app" {
  zone_id = data.terraform_remote_state.organization.outputs.hosted_zone_id
  name    = "${var.environment}.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "portal" {
  zone_id = data.terraform_remote_state.organization.outputs.hosted_zone_id
  name    = "portal${var.environment}.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "seniorliving" {
  zone_id = data.terraform_remote_state.organization.outputs.hosted_zone_id
  name    = "seniorliving${var.environment}.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
