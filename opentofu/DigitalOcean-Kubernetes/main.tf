terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.19.0"
    }
  }
  backend "s3" {
    bucket                      = "bcwhite-tech-opentofu-state"
    key                         = "k8s/terraform.tfstate"
    region                      = "us-east-1"
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    force_path_style            = true
  }
}

data "digitalocean_kubernetes_cluster" "bcwhite-tech-k8s-cluster" {
  name = var.kubernetes_cluster
}

provider "kubernetes" {
  host  = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.endpoint
  token = data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.bcwhite-tech-k8s-cluster.kube_config[0].cluster_ca_certificate
  )
}
resource "kubernetes_namespace" "ingress" {
  metadata { name = "ingress-nginx" }
}

resource "kubernetes_deployment" "ingress_controller" {
  depends_on = [kubernetes_service.ingress_lb]
  metadata {
    name      = "ingress-nginx-controller"
    namespace = kubernetes_namespace.ingress.metadata[0].name
    labels = {
      app = "ingress-nginx"
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "ingress-nginx"
      }
    }
    template {
      metadata {
        labels = {
          app = "ingress-nginx"
        }
      }
      spec {
        service_account_name = kubernetes_service_account.ingress_sa.metadata[0].name
        security_context {
          fs_group = 101
        }
        volume {
          name = "ssl"
          empty_dir {}
        }
        container {
          name  = "controller"
          # Pin image via variable for controlled upgrades; prefer digest pinning for supply-chain integrity.
          image = "registry.k8s.io/ingress-nginx/controller:${var.ingress_nginx_controller_version}"
          args  = [
            "/nginx-ingress-controller",
            "--publish-service=$(POD_NAMESPACE)/ingress-nginx-controller",
            "--election-id=ingress-controller-leader",
            "--controller-class=k8s.io/ingress-nginx",
            "--ingress-class=nginx"
          ]
          # Downward API env vars required so $(POD_NAMESPACE) expands; without these the controller cannot locate its Service.
          env {
            name = "POD_NAME"
            value_from {
              field_ref {
                field_path = "metadata.name"
              }
            }
          }
          env {
            name = "POD_NAMESPACE"
            value_from {
              field_ref {
                field_path = "metadata.namespace"
              }
            }
          }
          resources {
            limits = {
              cpu    = "300m"
              memory = "256Mi"
            }
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }
          security_context {
            run_as_non_root            = true
            run_as_user                = 101
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
            capabilities {
              drop = ["ALL"]
              add  = ["NET_BIND_SERVICE"]
            }
            seccomp_profile {
              type = "RuntimeDefault"
            }
          }
          port {
            name          = "http"
            container_port = 80
          }
          port {
            name          = "https"
            container_port = 443
          }
          liveness_probe {
            http_get {
              path = "/healthz"
              port = 10254
            }
            initial_delay_seconds = 10
            period_seconds        = 30
          }
          readiness_probe {
            http_get {
              path = "/ready"
              port = 10254
            }
            initial_delay_seconds = 10
            period_seconds        = 30
          }
          volume_mount {
            name       = "ssl"
            mount_path = "/etc/ingress-controller/ssl"
          }
        }
      }
    }
  }
}

resource "kubernetes_service_account" "ingress_sa" {
  metadata {
    name      = "ingress-nginx"
    namespace = kubernetes_namespace.ingress.metadata[0].name
    labels = {
      app = "ingress-nginx"
    }
  }
}

resource "kubernetes_cluster_role" "ingress" {
  metadata {
    name = "ingress-nginx"
    labels = {
      app = "ingress-nginx"
    }
  }
  rule {
    api_groups = [""]
    resources  = ["configmaps", "endpoints", "nodes", "pods", "secrets", "services", "namespaces"]
    verbs      = ["list", "watch"]
  }
  rule {
    api_groups = [""]
    resources  = ["nodes"]
    verbs      = ["get"]
  }
  rule {
    api_groups = [""]
    resources  = ["services"]
    verbs      = ["get"]
  }
  rule {
    api_groups = [""]
    resources  = ["events"]
    verbs      = ["create", "patch"]
  }
  rule {
    api_groups = ["networking.k8s.io"]
    resources  = ["ingresses", "ingressclasses"]
    verbs      = ["get", "list", "watch"]
  }
  rule {
    api_groups = ["networking.k8s.io"]
    resources  = ["ingresses/status"]
    verbs      = ["update"]
  }
  rule {
    api_groups = ["coordination.k8s.io"]
    resources  = ["leases"]
    verbs      = ["get", "create", "update"]
  }
  rule {
    api_groups = ["discovery.k8s.io"]
    resources  = ["endpointslices"]
    verbs      = ["list", "watch"]
  }
}

resource "kubernetes_cluster_role_binding" "ingress" {
  metadata {
    name = "ingress-nginx"
    labels = {
      app = "ingress-nginx"
    }
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.ingress_sa.metadata[0].name
    namespace = kubernetes_namespace.ingress.metadata[0].name
  }
  role_ref {
    kind     = "ClusterRole"
    name     = kubernetes_cluster_role.ingress.metadata[0].name
    api_group = "rbac.authorization.k8s.io"
  }
}

# Namespace-scoped Role for fine-grained configmap/event access (leader election & events)
resource "kubernetes_role" "ingress" {
  metadata {
    name      = "ingress-nginx"
    namespace = kubernetes_namespace.ingress.metadata[0].name
    labels = {
      app = "ingress-nginx"
    }
  }
  rule {
    api_groups = [""]
    resources  = ["configmaps", "pods", "secrets", "endpoints"]
    verbs      = ["get", "list", "watch"]
  }
  rule {
    api_groups = [""]
    resources  = ["configmaps"]
    verbs      = ["create"]
  }
  rule {
    api_groups = [""]
    resources  = ["configmaps"]
    resource_names = ["ingress-controller-leader"]
    verbs      = ["get", "update", "patch"]
  }
  rule {
    api_groups = [""]
    resources  = ["events"]
    verbs      = ["create", "patch"]
  }
}

resource "kubernetes_role_binding" "ingress" {
  metadata {
    name      = "ingress-nginx"
    namespace = kubernetes_namespace.ingress.metadata[0].name
    labels = {
      app = "ingress-nginx"
    }
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.ingress_sa.metadata[0].name
    namespace = kubernetes_namespace.ingress.metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.ingress.metadata[0].name
  }
}


resource "kubernetes_service" "ingress_lb" {
  metadata {
    name      = "ingress-nginx-controller"
    namespace = kubernetes_namespace.ingress.metadata[0].name
    labels = {
      app = "ingress-nginx"
    }
  }
  spec {
    selector = {
      app = "ingress-nginx"
    }
    port {
      name        = "http"
      port        = 80
      target_port = 80
      protocol    = "TCP"
    }
    port {
      name        = "https"
      port        = 443
      target_port = 443
      protocol    = "TCP"
    }
    type = "LoadBalancer"
  }
}
