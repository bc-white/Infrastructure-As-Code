output "cluster_connection_string" {
  description = "MongoDB Atlas cluster connection string"
  value       = mongodbatlas_advanced_cluster.primary.connection_strings.standard_srv
  sensitive   = true
}

output "cluster_id" {
  description = "MongoDB Atlas cluster ID"
  value       = mongodbatlas_advanced_cluster.primary.cluster_id
}

output "cluster_name" {
  description = "MongoDB Atlas cluster name"
  value       = mongodbatlas_advanced_cluster.primary.name
}

output "cluster_state" {
  description = "MongoDB Atlas cluster state"
  value       = mongodbatlas_advanced_cluster.primary.state_name
}
