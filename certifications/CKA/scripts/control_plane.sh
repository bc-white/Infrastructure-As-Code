#!/bin/env bash
# This script sets up the control plane node for a Kubernetes cluster.

# Update and install necessary packages
apt-get update
apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl

# Ensure swap is disabled
swapoff -a

# Load necessary kernel modules
modprobe overlay
modprobe br_netfilter
