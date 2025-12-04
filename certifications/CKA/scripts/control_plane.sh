#!/bin/env bash
# This script sets up the control plane node for a Kubernetes cluster.

# Stage Kubernetes repository
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.34/deb/Release.key | \
  gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /' | \
  tee /etc/apt/sources.list.d/kubernetes.list


# Update and install necessary packages
apt-get update
apt-get upgrade -y
apt-get install -y apt-transport-https \
  ca-certificates \
  containerd \
  curl \
  gpg \
  kubeadm \
  kubectl \
  kubelet \
  software-properties-common \
  socat \
  tree
apt-mark hold kubeadm kubectl kubelet

# Startup Kubelet service
systemctl enable --now kubelet

# Ensure swap is disabled
swapoff -a

# Load necessary kernel modules
modprobe overlay
modprobe br_netfilter

# Configure sysctl parameters for Kubernetes networking
cat <<EOF | tee /etc/sysctl.d/kubernetes.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# Apply sysctl parameters without reboot
sysctl --system
