#!/bin/env bash
###############################################################################
# This script upgrades Kubernetes components. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - CKA curriculum
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Backup Kubeadm Configuration
###############################################################################
mkdir -p /var/backups/kubeadm
cp /etc/kubernetes/admin.conf /var/backups/kubeadm/admin.conf.bak
cp /etc/kubernetes/kubelet.conf /var/backups/kubeadm/kubelet.conf.bak
cp /etc/kubernetes/kubeadm-config.yaml /var/backups/kubeadm/kubeadm-config.yaml.bak

###############################################################################
# Upgrade Kubernetes Components
###############################################################################
apt update
apt-mark unhold kubeadm kubectl kubelet
apt-get upgrade -y kubeadm
apt-mark hold kubeadm
kubectl drain k8s-control-plane --ignore-daemonsets
kubeadm upgrade apply v1.34.3
apt-get upgrade -y kubelet kubectl
apt-mark hold kubelet kubectl
systemctl daemon-reload
systemctl restart kubelet
kubectl uncordon k8s-control-plane

###############################################################################
# On Worker Nodes, run this instead
###############################################################################
apt update
apt-mark unhold kubeadm kubectl kubelet
apt-get upgrade -y kubeadm
apt-mark hold kubeadm
kubectl drain k8s-worker-1 --ignore-daemonsets # Run from control plane node
kubeadm upgrade node
apt-get upgrade -y kubelet kubectl
apt-mark hold kubelet kubectl
systemctl daemon-reload
systemctl restart kubelet
kubectl uncordon k8s-worker-1 # Run from control plane node
