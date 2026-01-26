resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  access_logs {
    bucket  = data.terraform_remote_state.bootstrap.outputs.s3_access_logs_bucket_name
    enabled = true
    prefix  = "alb-test"
  }
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.terraform_remote_state.network.outputs.alb_security_group_id]
  subnets            = data.terraform_remote_state.network.outputs.public_subnet_ids
  enable_deletion_protection = false
  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name_prefix = "${substr(local.name_prefix, 0, 6)}-"
  port        = 443
  protocol    = "HTTPS"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTPS"
    matcher             = "200"
  }
  tags = {
    Name = "${local.name_prefix}-tg"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_acm_certificate" "main" {
  domain_name       = "${var.environment}.${var.org_name}.local"
  validation_method = "DNS"
  tags = {
    Name = "${local.name_prefix}-cert"
  }
  lifecycle {
    create_before_destroy = true
  }
}
