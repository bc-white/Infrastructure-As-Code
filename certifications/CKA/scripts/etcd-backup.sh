#!/usr/bin/env bash
###############################################################################
# This script backs up the existing etcd data. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# VARIABLES
###############################################################################
ETCD_POD="$(kubectl get pods -n kube-system -l component=etcd -o jsonpath='{.items[0].metadata.name}')"
ETCD_DATA_DIR="$(kubectl get pods -n kube-system -l component=etcd -o jsonpath='{.items[0].spec.containers[0].volumeMounts[?(@.name=="etcd-data")].mountPath}')"
ETCD_BACKUP_DIR="/var/backups/etcd"

###############################################################################
# Create Backup Directory
###############################################################################
mkdir -p ${ETCD_BACKUP_DIR}

###############################################################################
# Check Etcd Health
###############################################################################
kubectl exec -n kube-system ${ETCD_POD} -- etcdctl \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  endpoint health

###############################################################################
# Determine Number of Databases
###############################################################################
kubectl exec -n kube-system ${ETCD_POD} -- etcdctl \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  endpoint member list -w table

###########################################################################
# Perform Backup
###########################################################################
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
kubectl exec -n kube-system ${ETCD_POD} -- etcdctl \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save ${ETCD_DATA_DIR}/etcd-snapshot-${TIMESTAMP}.db
mv ${ETCD_DATA_DIR}/etcd-snapshot-${TIMESTAMP}.db ${ETCD_BACKUP_DIR}/.
