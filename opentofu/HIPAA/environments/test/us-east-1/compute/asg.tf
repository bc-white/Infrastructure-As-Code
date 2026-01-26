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
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }
  vpc_security_group_ids = [data.terraform_remote_state.network.outputs.ec2_security_group_id]
  network_interfaces {
    associate_public_ip_address = false
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
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  min_size            = 0
  max_size            = 3
  desired_capacity    = 1
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
