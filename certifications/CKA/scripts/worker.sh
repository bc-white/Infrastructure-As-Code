#!/bin/env bash
# This script sets up a worker node for a Kubernetes cluster.

# Update and install necessary packages
apt-get update && apt-get install -y apt-transport-https ca-certificates curl
