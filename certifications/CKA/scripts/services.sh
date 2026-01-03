#!/bin/env bash
###############################################################################
# This script deploys services within a kubernetes cluster.
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - CKA curriculum
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Create a NodePort Service
###############################################################################
cat <<EOF > nodeport-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: webserver
  name: webserver
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webserver
  strategy: {}
  template:
    metadata:
      labels:
        app: webserver
    spec:
      containers:
      - image: nginx:1.22.1
        name: nginx
        resources: {}
        ports:
        - containerPort: 8080
          protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: nodeport-service
spec:
  type: NodePort
  selector:
    app: webserver
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
EOF
kubectl apply -f nodeport-service.yaml
