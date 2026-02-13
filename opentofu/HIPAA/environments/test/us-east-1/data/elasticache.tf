resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = data.terraform_remote_state.network.outputs.private_subnet_ids
  tags = {
    Name = "${local.name_prefix}-redis-subnet-group"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.name_prefix}-redis-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id
  tags = {
    Name = "${local.name_prefix}-redis-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_ec2" {
  security_group_id            = aws_security_group.redis.id
  description                  = "Allow Redis traffic from EC2 instances"
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
  referenced_security_group_id = data.terraform_remote_state.network.outputs.ec2_security_group_id
  tags = {
    Name = "${local.name_prefix}-redis-from-ec2"
  }
}

resource "aws_vpc_security_group_egress_rule" "redis_all" {
  security_group_id = aws_security_group.redis.id
  description       = "Allow all outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  tags = {
    Name = "${local.name_prefix}-redis-egress-all"
  }
}

resource "aws_elasticache_parameter_group" "redis" {
  name        = "${local.name_prefix}-redis-params"
  family      = "redis7"
  description = "Custom parameter group for Redis 7"
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  tags = {
    Name = "${local.name_prefix}-redis-params"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.org_name}-${var.project_name}-${var.environment}-redis"
  description                = "Redis cluster for ${var.environment} environment"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_cache_nodes
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.customer_data.arn
  transit_encryption_enabled = true
  transit_encryption_mode    = "required"
  auth_token                 = random_password.redis_auth_token.result
  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled           = var.redis_num_cache_nodes > 1
  auto_minor_version_upgrade = true
  maintenance_window         = "sun:05:00-sun:06:00"
  snapshot_retention_limit   = var.environment == "prod" ? 7 : 1
  snapshot_window            = "03:00-04:00"
  tags = {
    Name = "${local.name_prefix}-redis"
  }
}
