# Infrastructure-As-Code


![License](https://img.shields.io/badge/license-Apache%202.0-green.svg?style=flat)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bc-white_Infrastructure-As-Code&metric=alert_status&token=8975cf40ba5a7c0a6a528570836900e257f7ca48)](https://sonarcloud.io/summary/new_code?id=bc-white_Infrastructure-As-Code)
[![Build](https://github.com/bc-white/Infrastructure-As-Code/actions/workflows/build.yml/badge.svg)](https://github.com/bc-white/Infrastructure-As-Code/actions/workflows/main_build.yml)

This repository contains infrastructure as code items from my time as an engineer.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/bc-white/Infrastructure-As-Code)

# Suggested Prerequisites

This repository assumes you will be launching the code from GitPod and also that you have a [Personal Configuration Repository](https://github.com/bc-white/Configurations) that accounts for standing up various tools like Terraform, AWS CLI, GCP CLI, and others. If you do not have this setup, you can initialize a fairly basic version of this repository from the [Gitpod Dotfiles Template Repository](https://github.com/gitpod-samples/demo-dotfiles-with-gitpod).

This repository launches a lightly customized Docker container that installs the latest Java to enable SonarQube to run scans.
