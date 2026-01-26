#!/usr/bin/env bash
###############################################################################
# This script runs deployments and replica sets within a kubernetes cluster.
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Create a Replica Set
###############################################################################
cat <<EOF > replica-set.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: rs-one
spec:
  replicas: 2
  selector:
    matchLabels:
      system: ReplicaOne
  template:
    metadata:
      labels:
        system: ReplicaOne
    spec:
      containers:
      - name: nginx
        image: nginx:1.22.1
        ports:
        - containerPort: 80
EOF

kubectl apply -f replica-set.yaml

###############################################################################
# Create a Deployment
###############################################################################

kubectl create deploy webserver --image nginx:1.22.1 --replicas=2 \
  --dry-run=client -o yaml | tee deployment.yaml
kubectl apply -f deployment.yaml
kubectl set image deploy webserver nginx=nginx:1.23.1-alpine --record
kubectl rollout history deploy webserver
kubectl rollout history deploy webserver --revision=1
kubectl rollout undo deploy webserver


###############################################################################
# DaemonSet Example
###############################################################################
cat <<EOF > daemon-set.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ds-one
spec:
  selector:
    matchLabels:
      app: ds-one
  template:
    metadata:
      labels:
        app: ds-one
    spec:
      containers:
      - name: nginx
        image: nginx:1.22.1
        ports:
        - containerPort: 80
EOF
kubectl apply -f daemon-set.yaml
