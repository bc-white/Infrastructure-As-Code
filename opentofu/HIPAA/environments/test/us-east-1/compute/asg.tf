data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "${local.name_prefix}-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  user_data = base64encode(templatefile("${path.module}/user_data.tpl", {
    region           = var.region
    environment      = var.environment
    org_name         = var.org_name
    project_name     = var.project_name
    domain_name      = var.domain_name
    redis_endpoint   = data.terraform_remote_state.data.outputs.redis_primary_endpoint
    artifacts_bucket = data.terraform_remote_state.data.outputs.artifacts_bucket_name
    uploads_bucket   = data.terraform_remote_state.data.outputs.uploads_bucket_name
    api_log_group    = aws_cloudwatch_log_group.application.name
  }))
  iam_instance_profile {
    arn = data.terraform_remote_state.data.outputs.ec2_instance_profile_arn
  }
  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = data.terraform_remote_state.data.outputs.customer_kms_key_arn
      delete_on_termination = true
    }
  }
  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [data.terraform_remote_state.network.outputs.ec2_security_group_id]
  }
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  monitoring {
    enabled = true
  }
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${local.name_prefix}-instance"
    }
  }
}

resource "aws_autoscaling_group" "main" {
  name_prefix         = "${local.name_prefix}-"
  vpc_zone_identifier = data.terraform_remote_state.network.outputs.private_subnet_ids
  target_group_arns = [
    aws_lb_target_group.api.arn,
    aws_lb_target_group.app.arn,
    aws_lb_target_group.portal.arn,
    aws_lb_target_group.seniorliving.arn
  ]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 0
  max_size                  = 3
  desired_capacity          = 0
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-asg"
    propagate_at_launch = false
  }
}

resource "aws_autoscaling_schedule" "scale_down" {
  scheduled_action_name  = "${local.name_prefix}-scale-down"
  autoscaling_group_name = aws_autoscaling_group.main.name
  recurrence             = "0 23 * * 1-5"
  min_size               = 0
  max_size               = 0
  desired_capacity       = 0
  time_zone              = "America/New_York"
}
