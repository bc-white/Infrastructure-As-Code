resource "aws_lb" "main" {
  name               = "${local.name_prefix}-nlb"
  load_balancer_type = "network"
  security_groups    = [data.terraform_remote_state.network.outputs.lb_security_group_id]
  subnets            = data.terraform_remote_state.network.outputs.public_subnet_ids
  enable_deletion_protection = false
  enable_cross_zone_load_balancing = true
  access_logs {
    bucket  = data.terraform_remote_state.data.outputs.uploads_bucket_name
    prefix = "nlb-logs/"
    enabled = false #NOSONAR test environment with no log retention
  }
  tags = {
    Name = "${local.name_prefix}-nlb"
  }
}
resource "aws_lb_target_group" "main" {
  name_prefix = local.tg_name_prefix
  port        = 443
  protocol    = "TCP"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
  }
  tags = {
    Name = "${local.name_prefix}-tg"
  }
}
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "TCP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
