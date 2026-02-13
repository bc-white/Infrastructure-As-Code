resource "mongodbatlas_project" "main" {
  name   = "${var.org_name}-${var.project_name}"
  org_id = var.mongodbatlas_org_id
}
