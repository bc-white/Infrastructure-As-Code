#!/usr/bin/env bash
###############################################################################
# This script exercises service meshes, ingress controllers, and gateway apis
# in the cluster. It is cobbled together from things I have learned from
# various sources
# including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Service Mesh Setup
###############################################################################
# Download and install Linkerd CLI
curl -sL run.linkerd.io/install-edge | sh

# Add Linkerd to PATH
export PATH=$PATH:$HOME/.linkerd2/bin
echo "export PATH=$PATH:/home/student/.linkerd2/bin" >> $HOME/.bashrc
linkerd check --pre

# Install Linkerd control plane onto the cluster
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/\
  releases/download/v1.2.1/standard-install.yaml

# Install Linkerd CRDs
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -

# Check that Linkerd is installed correctly
linkerd check

# Install Linkerd Viz extension for observability
linkerd viz install | kubectl apply -f -
linkerd viz check

# Open Linkerd Viz dashboard in the background
linkerd viz dashboard &

# Update Viz setup to publish on host other than localhost
# (Just comment out -enforce-host flag)
kubectl -n linkerd-viz edit deploy web
# Edit the service http port to be a nodePort and set accessible port
kubectl edit svc web -n linkerd-viz

###############################################################################
# Ingress Controller Setup
###############################################################################
# Install NGINX Ingress Controller via Helm
helm search hub ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm fetch ingress-nginx/ingress-nginx --untar

# Update values.yaml if needed (change to daemonset)
sed -i 's/kind: Deployment/kind: DaemonSet/g' ingress-nginx/values.yaml
helm install myingress .

# Setup the Ingress resource
cat <<EOF > ingress-resource.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-test
  annotations:
    nginx.ingress.kubernetes.io/service-upstream: "true"
  namespace: default
spec:
  ingressClassName: nginx
  rules:
  - host: www.external.com
    http:
      paths:
      - backend:
          service:
            name: web-one
            port:
              number: 80
        path: /
        pathType: ImplementationSpecific
EOF
kubectl apply -f ingress-resource.yaml

# Inject Linkerd sidecar into the Ingress controller pods
kubectl get ds myingress-ingress-nginx-controller -o yaml |\
  linkerd inject --ingress - | kubectl apply -f -

###############################################################################
# Gateway API Setup
###############################################################################
# Deploy NGINX Gateway Fabric which supports Gateway API
kubectl kustomize "https://github.com/nginx/nginx-gateway-fabric/\
  config/crd/gateway-api/standard?ref=v1.6.1" | kubectl apply -f -
# Deploy NGINX Gateway Fabric components
kubectl apply -f https://raw.githubusercontent.com/nginx/\
  nginx-gateway-fabric/v1.6.1/deploy/crds.yaml
# Deploy NGINX Gateway Fabric default deployment
kubectl apply -f https://raw.githubusercontent.com/nginx/\
  nginx-gateway-fabric/v1.6.1/deploy/default/deploy.yaml
kubectl get all -n nginx-gateway
# Patch the NGINX Gateway service to be NodePort type
kubectl patch service/nginx-gateway -n nginx-gateway -p '{"spec": {"type": "NodePort"}}'

# Setup Deployments and Services to be exposed via Gateway API
cat <<EOF > gateway-api-deployments.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: movies
spec:
  replicas: 2
  selector:
    matchLabels:
      app: movies
  strategy: {}
  template:
    metadata:
      labels:
        app: movies
    spec:
      containers:
      - image: nginx
        name: movies
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: movies
spec:
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: movies
EOF
kubectl apply -f gateway-api-deployments.yaml

# Setup Gateway API resources
cat <<EOF > gateway-resources.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: blockbuster
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    protocol: HTTP
    port: 80
EOF
kubectl apply -f gateway-resources.yaml
kubectl get gateway

# Setup HTTPRoute to route traffic to services
cat <<EOF > httproute.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: blockbuster-route
spec:
  parentRefs:
  - name: blockbuster
  hostnames:
  - "blockbuster.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: movies
      port: 80
EOF
kubectl apply -f httproute.yaml
kubectl get httproute

# Test it out
export HOST=$(hostname -i | awk '{print $2}')
curl --resolve blockbuster.example.com:32500:$HOST http://blockbuster.example.com:32500/
