#!/bin/env bash
###############################################################################
# This script creates a namespace that is intended to have low resource
# limitations put into place to demonstrate constraints. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Create the namespace
###############################################################################
kubectl create namespace limited-namespace

###############################################################################
# Create Resource Quota And Apply It To The Namespace
###############################################################################
cat << EOF > ./limited-namespace-quota.yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: limit-resource-range
spec:
  limits:
    - default:
        cpu: 1
        memory: 500Mi
      defaultRequest:
        cpu: 0.5
        memory: 100Mi
      type: Container
EOF
kubectl create -f ./limited-namespace-quota.yaml -n limited-namespace
