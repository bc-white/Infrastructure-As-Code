#!/bin/env bash
###############################################################################
# This script exercises labels, taints, tolerations, and scheduling.
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

# Observe the existing nodes and their labels and taints
kubectl describe nodes | grep -A 7 -i labels
kubectl describe nodes | grep -A 2 -i taints

# Observe the existing deployments
kubectl get deployments --all-namespaces
crictl ps | wc -l

# Label the control-plane node with a custom label
kubectl label node k8s-control-plane status=vip
kubectl label node k8s-worker-1 status=standard

# Setup a pod with nodeSelector to schedule on the control-plane node
cat <<EOF > vip-deployment.yaml
apiVersion: v1
kind: Pod
metadata:
  name: vip
spec:
  containers:
  - name: vip1
    image: busybox
    command: ["sleep", "3600"]
  - name: vip2
    image: busybox
    command: ["sleep", "3600"]
  - name: vip3
    image: busybox
    command: ["sleep", "3600"]
  nodeSelector:
    status: vip
EOF
kubectl apply -f vip-deployment.yaml

# Now we will use taints and tolerations to control scheduling
kubectl taint nodes k8s-worker-1 potato=value:PreferNoSchedule
cat <<EOF > taint-deployment.yaml
apiVersion: v1
kind: Pod
metadata:
  name: taint-test
spec:
  containers:
  - name: taint1
    image: busybox
    command: ["sleep", "3600"]
  - name: taint2
    image: busybox
    command: ["sleep", "3600"]
  tolerations:
  - key: "potato"
    operator: "Equal"
    value: "value"
    effect: "NoSchedule"
EOF
kubectl apply -f taint-deployment.yaml
kubectl delete -f taint-deployment.yaml
kubectl taint nodes k8s-worker-1 potato=value:NoSchedule
kubectl apply -f taint-deployment.yaml
kubectl delete -f taint-deployment.yaml
kubectl taint nodes k8s-worker-1 potato-
