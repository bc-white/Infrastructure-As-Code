resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain_name
  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
  tags = {
    Name = "${var.org_name}-${var.project_name}-ses-identity"
  }
}

resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = aws_route53_zone.primary.zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "root_txt" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = var.domain_name
  type            = "TXT"
  ttl             = 600
  allow_overwrite = true
  records = [
    "google-site-verification=MfztWWpZ9uCIK24jHp3tO0i76AuCjfdrrCf6Q5uVaaE",
    "v=spf1 include:_spf.google.com include:amazonses.com ~all"
  ]
}

resource "aws_route53_record" "ses_dmarc" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = "_dmarc.${var.domain_name}"
  type            = "TXT"
  ttl             = 600
  allow_overwrite = true
  records         = ["v=DMARC1; p=quarantine; rua=mailto:security@${var.domain_name}; ruf=mailto:security@${var.domain_name}; fo=1; adkim=s; aspf=s; pct=100"]
}

resource "aws_route53_record" "ses_send_subdomain" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = "send.${var.domain_name}"
  type            = "TXT"
  ttl             = 600
  allow_overwrite = true
  records         = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "ses_send_mx" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = "send.${var.domain_name}"
  type            = "MX"
  ttl             = 600
  allow_overwrite = true
  records         = ["10 feedback-smtp.${var.primary_region}.amazonses.com"]
}

resource "aws_route53_record" "root_mx" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = var.domain_name
  type            = "MX"
  ttl             = 3600
  allow_overwrite = true
  records = [
    "1 aspmx.l.google.com",
    "5 alt1.aspmx.l.google.com",
    "5 alt2.aspmx.l.google.com",
    "10 alt3.aspmx.l.google.com",
    "10 alt4.aspmx.l.google.com"
  ]
}

resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = "${var.org_name}-${var.project_name}"
  delivery_options {
    tls_policy = "REQUIRE"
  }
  reputation_options {
    reputation_metrics_enabled = true
  }
  sending_options {
    sending_enabled = true
  }
  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

resource "aws_sesv2_configuration_set_event_destination" "cloudwatch" {
  configuration_set_name = aws_sesv2_configuration_set.main.configuration_set_name
  event_destination_name = "cloudwatch"
  event_destination {
    cloud_watch_destination {
      dimension_configuration {
        default_dimension_value = "default"
        dimension_name          = "ses:configuration-set"
        dimension_value_source  = "MESSAGE_TAG"
      }
    }
    enabled = true
    matching_event_types = [
      "SEND",
      "REJECT",
      "BOUNCE",
      "COMPLAINT",
      "DELIVERY",
      "OPEN",
      "CLICK",
      "RENDERING_FAILURE"
    ]
  }
}
