resource "kubernetes_deployment" "nginx_dev" {
  depends_on = [helm_release.ingress_nginx]
  metadata {
    name = "nginx-dev"
    labels = { app = "nginx-dev" }
  }
  spec {
    replicas = 1
    selector { match_labels = { app = "nginx-dev" } }
    template {
      metadata { labels = { app = "nginx-dev" } }
      spec {
        container {
          name  = "nginx"
          image = "nginx:1.25-alpine"
          port {
            name           = "http"
            container_port = 80
          }
          resources {
            requests = { cpu = "50m", memory = "64Mi" }
            limits   = { cpu = "200m", memory = "128Mi" }
          }
          readiness_probe {
            http_get {
              path = "/"
              port = "http"
            }
            initial_delay_seconds = 3
            period_seconds        = 5
          }
          liveness_probe {
            http_get {
              path = "/"
              port = "http"
            }
            initial_delay_seconds = 15
            period_seconds        = 20
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "nginx_dev" {
  metadata { name = "nginx-dev" }
  spec {
    selector = { app = "nginx-dev" }
    port {
      name        = "http"
      port        = 80
      target_port = 80
    }
  }
}

resource "kubernetes_ingress_v1" "nginx_dev" {
  depends_on = [kubernetes_service.nginx_dev, helm_release.ingress_nginx]
  metadata {
    name = "nginx-dev"
    annotations = {
      "nginx.ingress.kubernetes.io/rewrite-target" = "/"
    }
  }
  spec {
    ingress_class_name = "nginx"
    rule {
      host = "${var.cloudflare_record_name}.${var.cloudflare_zone_name}"
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = kubernetes_service.nginx_dev.metadata[0].name
              port { number = 80 }
            }
          }
        }
      }
    }
  }
}
