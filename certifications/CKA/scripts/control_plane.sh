#!/bin/env bash
###############################################################################
# This script sets up the control plane node for a Kubernetes cluster. It
# installs and configures the necessary components. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - CKA curriculum
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Configure Base Linux System
###############################################################################
# Stage Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Stage Kubernetes repository
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.34/deb/Release.key | \
  gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /' | \
  tee /etc/apt/sources.list.d/kubernetes.list

  # Stage Helm repository
apt-get install curl gpg apt-transport-https --yes
curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | \
  gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" | \
  tee /etc/apt/sources.list.d/helm-stable-debian.list

# Update and install necessary packages
apt-get update
apt-get upgrade -y
apt-get install -y apt-transport-https \
  ca-certificates \
  containerd \
  curl \
  gpg \
  helm \
  jq \
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

###############################################################################
# Configure Containerd
###############################################################################
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
sed -e 's/SystemdCgroup = false/SystemdCgroup = true/g' -i /etc/containerd/config.toml
systemctl restart containerd

###############################################################################
# Configure Local Network DNS
###############################################################################
cat <<EOF | tee /etc/hosts
`hostname -I | awk '{print $1}'`  control-plane
EOF

###############################################################################
# Configure Kubeadm and Initialize Control Plane
###############################################################################
cat <<EOF | tee /etc/kubernetes/kubeadm-config.yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: `kubectl version| grep Client | cut -d: -f2 | cut -dv -f2`
controlPlaneEndpoint: "control-plane:6443"
networking:
  podSubnet: "192.168.0.0/16"
EOF

kubeadm init --config /etc/kubernetes/kubeadm-config.yaml --upload-certs | tee /root/kubeadm-init.out
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

###############################################################################
# Install a Pod Network Add-on (Cilium)
###############################################################################
helm repo add cilium https://helm.cilium.io/
helm repo update
helm template cilium cilium/cilium --version 1.16.1 --namespace kube-system > /etc/kubernetes/cilium.yaml
kubectl apply -f /etc/kubernetes/cilium.yaml
