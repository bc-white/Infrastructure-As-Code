#!/bin/env bash
###############################################################################
# This script exercises creating a new user and adding them to a Kubernetes
# cluster. It is cobbled together from things I have learned from various
# sources
# including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

# Backup existing kubeconfig
cp ~/.kube/config ~/.kube/config.bak

# Setup a development namespace
kubectl create namespace development

# Setup a new user and generating certificates
useradd -m testuser
cd /home/testuser
openssl genrsa -out testuser.key 4096
openssl req -new -key testuser.key -out testuser.csr -subj "/CN=testuser/O=testing"
openssl x509 -req -in testuser.csr \
  -CA /etc/kubernetes/pki/ca.crt \
  -CAkey /etc/kubernetes/pki/ca.key \
  -CAcreateserial -out testuser.crt \
  -days 365
chown testuser:testuser testuser.key testuser.csr testuser.crt

# Configure kubectl for the new user
kubectl config set-credentials testuser \
  --client-certificate=/home/testuser/testuser.crt \
  --client-key=/home/testuser/testuser.key
kubectl config set-context testuser-context \
  --cluster=kubernetes \
  --namespace=development \
  --user=testuser

# Test the new user context
kubectl get pods --context=testuser-context

# Create a Role and RoleBinding for the new user
cat <<EOF > ~/manifests/role.yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: development
  name: developer
rules:
- apiGroups: ["", "extensions", "apps"]
  resources: ["pods", "deployments", "replicasets"]
  verbs: ["get", "watch", "list", "create", "update", "delete", "patch"]
EOF
kubectl apply -f ~/manifests/role.yaml

cat <<EOF > ~/manifests/rolebinding.yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: developer-binding
  namespace: development
subjects:
- kind: User
  name: testuser
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
EOF
kubectl apply -f ~/manifests/rolebinding.yaml
