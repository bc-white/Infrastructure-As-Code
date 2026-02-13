resource "aws_lb" "main" {
  name                       = "${local.name_prefix}-alb"
  load_balancer_type         = "application"
  security_groups            = [data.terraform_remote_state.network.outputs.lb_security_group_id]
  subnets                    = data.terraform_remote_state.network.outputs.public_subnet_ids
  enable_deletion_protection = false
  enable_http2               = true
  access_logs {
    bucket  = data.terraform_remote_state.data.outputs.uploads_bucket_name
    prefix  = "alb-logs/"
    enabled = var.environment == "prod"
  }
  tags = {
    Name = "${local.name_prefix}-alb"
  }
}

resource "aws_lb_target_group" "api" {
  name_prefix          = "${local.tg_name_prefix}a-"
  port                 = 3000
  protocol             = "HTTPS"
  vpc_id               = data.terraform_remote_state.network.outputs.vpc_id
  target_type          = "instance"
  deregistration_delay = 30
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = 5
  }
  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 86400
  }
  tags = {
    Name = "${local.name_prefix}-api-tg"
  }
}

resource "aws_lb_target_group" "app" {
  name_prefix          = "${local.tg_name_prefix}m-"
  port                 = 3001
  protocol             = "HTTPS"
  vpc_id               = data.terraform_remote_state.network.outputs.vpc_id
  target_type          = "instance"
  deregistration_delay = 30
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = 5
  }
  tags = {
    Name = "${local.name_prefix}-app-tg"
  }
}

resource "aws_lb_target_group" "portal" {
  name_prefix          = "${local.tg_name_prefix}p-"
  port                 = 3002
  protocol             = "HTTPS"
  vpc_id               = data.terraform_remote_state.network.outputs.vpc_id
  target_type          = "instance"
  deregistration_delay = 30
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = 5
  }
  tags = {
    Name = "${local.name_prefix}-portal-tg"
  }
}

resource "aws_lb_target_group" "seniorliving" {
  name_prefix          = "${local.tg_name_prefix}s-"
  port                 = 3003
  protocol             = "HTTPS"
  vpc_id               = data.terraform_remote_state.network.outputs.vpc_id
  target_type          = "instance"
  deregistration_delay = 30
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = 5
  }
  tags = {
    Name = "${local.name_prefix}-seniorliving-tg"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.wildcard.certificate_arn
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
  condition {
    host_header {
      values = ["api${var.environment}.${var.domain_name}"]
    }
  }
}

resource "aws_lb_listener_rule" "app" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 200
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
  condition {
    host_header {
      values = ["${var.environment}.${var.domain_name}"]
    }
  }
}

resource "aws_lb_listener_rule" "portal" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 300
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.portal.arn
  }
  condition {
    host_header {
      values = ["portal${var.environment}.${var.domain_name}"]
    }
  }
}

resource "aws_lb_listener_rule" "seniorliving" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 400
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.seniorliving.arn
  }
  condition {
    host_header {
      values = ["seniorliving${var.environment}.${var.domain_name}"]
    }
  }
}
