#!/bin/env bash
###############################################################################
# This script runs deployments and replica sets within a kubernetes cluster.
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - CKA curriculum
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
