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

###############################################################################
# Creating Persistent Volumes
###############################################################################
# Setting up NFS for PVs
apt-get update
apt-get install -y nfs-kernel-server nfs-common
mkdir -p /srv/nfs/kubedata
chown nobody:nogroup /srv/nfs/kubedata
chmod 1777 /srv/nfs/kubedata
echo "/srv/nfs/kubedata *(rw,sync,no_subtree_check,no_root_squash)" >> /etc/exports
exportfs -ra
systemctl restart nfs-kernel-server
mount -t nfs localhost:/srv/nfs/kubedata /mnt
# Create Persistent Volume
cat <<EOF > pv-nfs.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-vol-1
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  nfs:
    path: /srv/nfs/kubedata
    server: k8s-control-plane
    readOnly: false
EOF
kubectl apply -f pv-nfs.yaml
# Create Persistent Volume Claim
cat <<EOF > pvc-nfs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-vol-1
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 200Mi
EOF
kubectl apply -f pvc-nfs.yaml
