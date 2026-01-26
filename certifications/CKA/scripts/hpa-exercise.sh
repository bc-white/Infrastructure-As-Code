#!/usr/bin/env bash
###############################################################################
# This script exercises Horizontal Pod Autoscaling (HPA) in the cluster.
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Setup Helm
###############################################################################
wget https://get.helm.sh/helm-v3.11.3-linux-amd64.tar.gz
tar -zxvf helm-v3.11.3-linux-amd64.tar.gz
cp linux-amd64/helm /usr/local/bin/helm

###############################################################################
# Setup Metrics Server
###############################################################################
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm fetch metrics-server/metrics-server --untar
# Update the metrics-server deployment to allow for unsecured TLS communication
sed -i 's/args:/args:\n        - --kubelet-insecure-tls/g' metrics-server/values.yaml
helm install metrics-server metrics-server/ --namespace kube-system \
  -f metrics-server/values.yaml

###############################################################################
# Create a Deployment to be scaled
###############################################################################
cat <<EOF > hpa-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hpa-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hpa-deployment
  template:
    metadata:
      labels:
        app: hpa-deployment
    spec:
      containers:
      - name: hpa-deployment
        image: registry.k8s.io/hpa-example
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 5m
          limits:
            cpu: 10m
---
apiVersion: v1
kind: Service
metadata:
  name: hpa-service
spec:
  selector:
    app: hpa-deployment
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF

kubectl apply -f hpa-deployment.yaml

###############################################################################
# Setup Autoscaling
###############################################################################

kubectl autoscale deployment hpa-deployment \
  --cpu=50% --min=2 --max=10 \
  --dry-run=client -o yaml > hpa.yaml

kubectl apply -f hpa.yaml
