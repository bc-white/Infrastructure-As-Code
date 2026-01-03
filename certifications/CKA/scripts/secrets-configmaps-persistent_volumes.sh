#!/bin/env bash
###############################################################################
# This script sets up PVs, Secrets, and ConfigMaps within a kubernetes cluster..
# It is cobbled together from things I have learned from various sources
# including:
# - Kubernetes documentation
# - CKA curriculum
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Prep Files For COnfigMaps
###############################################################################
mkdir -p primary
echo "cyan" > primary/cyan
echo "magenta" > primary/magenta
echo "yellow" > primary/yellow
echo "black" > primary/black
echo "known as key" >> primary/black
echo "blue" > favorite

kubectl create configmap colors \
  --from-literal=text=black  \
  --from-file=./favorite  \
  --from-file=./primary/
kubectl get configmaps colors -o yaml
# Create Demo Pod To Use ConfigMap
cat <<EOF > configmap-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-demo
spec:
  containers:
  - name: nginx
    image: nginx
    env:
    - name: FAVORITE_COLOR
      valueFrom:
        configMapKeyRef:
          name: colors
          key: favorite
EOF
kubectl apply -f configmap-pod.yaml
kubectl exec -it configmap-demo -- printenv FAVORITE_COLOR
kubectl delete pod configmap-demo
kubectl delete configmap colors
