resource "mongodbatlas_privatelink_endpoint" "aws" {
  project_id    = data.terraform_remote_state.mongo_org.outputs.mongodb_project_id
  provider_name = "AWS"
  region        = var.region
}

resource "aws_vpc_endpoint" "mongodb_atlas" {
  vpc_id              = module.vpc.vpc_id
  service_name        = mongodbatlas_privatelink_endpoint.aws.endpoint_service_name
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.mongodb_privatelink.id]
  private_dns_enabled = false
  tags = {
    Name = "${local.name_prefix}-mongodb-privatelink"
  }
}

resource "mongodbatlas_privatelink_endpoint_service" "aws" {
  project_id          = data.terraform_remote_state.mongo_org.outputs.mongodb_project_id
  private_link_id     = mongodbatlas_privatelink_endpoint.aws.private_link_id
  endpoint_service_id = aws_vpc_endpoint.mongodb_atlas.id
  provider_name       = "AWS"
}

resource "aws_security_group" "mongodb_privatelink" {
  name_prefix = "${local.name_prefix}-mongodb-privatelink-"
  description = "Security group for MongoDB Atlas PrivateLink"
  vpc_id      = module.vpc.vpc_id
  ingress {
    description     = "MongoDB Atlas PrivateLink ports from EC2 instances"
    from_port       = 1024
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${local.name_prefix}-mongodb-privatelink-sg"
  }
}
