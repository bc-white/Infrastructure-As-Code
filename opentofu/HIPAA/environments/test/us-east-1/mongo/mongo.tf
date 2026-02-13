resource "mongodbatlas_advanced_cluster" "primary" {
  project_id   = data.terraform_remote_state.mongo_org.outputs.mongodb_project_id
  name         = "${local.name_prefix}-cluster"
  cluster_type = "REPLICASET"
  replication_specs = [
    {
      region_configs = [
        {
          electable_specs = {
            instance_size = "M10"
            node_count    = 3
          }
          priority      = 7
          provider_name = "AWS"
          region_name   = "US_EAST_1"
        }
      ]
    }
  ]
}

resource "mongodbatlas_database_user" "ec2_iam" {
  username           = data.terraform_remote_state.data.outputs.ec2_role_arn
  project_id         = data.terraform_remote_state.mongo_org.outputs.mongodb_project_id
  auth_database_name = "$external"
  aws_iam_type       = "ROLE"
  roles {
    role_name     = "readWrite"
    database_name = var.database_name
  }
}
