#!/bin/env bash
###############################################################################
# This script exports required data from the kube config to test TLS
# connections and to perform raw curls. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - CKA curriculum
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Extract certs and keys from kubeconfig
###############################################################################
cat ~/.kube/config | grep client-certificate-data | awk '{print $2}' | base64 --decode > /tmp/client-cert.pem
cat ~/.kube/config | grep client-key-data | awk '{print $2}' | base64 --decode > /tmp/client-key.pem
cat ~/.kube/config | grep certificate-authority-data | awk '{print $2}' | base64 --decode > /tmp/ca-cert.pem

###############################################################################
# Test TLS connection using extracted certs and keys
###############################################################################
curl --verbose \
  --cert /tmp/client-cert.pem \
  --key /tmp/client-key.pem \
  --cacert /tmp/ca-cert.pem \
  https://control-plane:6443/api/v1/namespaces/kube-system/pods
