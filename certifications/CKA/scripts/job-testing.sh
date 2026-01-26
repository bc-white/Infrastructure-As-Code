#!/usr/bin/env bash
###############################################################################
# This script runs jobs within a kubernetes cluster. It is cobbled together
# from things I have learned from various sources including:
# - Kubernetes documentation
# - Various GitHub repositories, blogs, and tutorials
# - Personal experience
###############################################################################

###############################################################################
# Create a simple sleep job
###############################################################################
cat <<EOF > sleep-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sleepy
spec:
  template:
    spec:
      containers:
      - name: resting
        image: busybox
        command: ["/bin/sleep"]
        args: ["3"]
      restartPolicy: Never
EOF

###############################################################################
# Apply and describe the job
###############################################################################
kubectl apply -f sleep-job.yaml
kubectl describe jobs.batch sleepy
kubectl delete jobs.batch sleepy

###############################################################################
# Now a CronJob
###############################################################################
cat <<EOF > cron-sleep-job.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sleepy
spec:
  schedule: "*/2 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: resting
            image: busybox
            command: ["/bin/sleep"]
            args: ["5"]
          restartPolicy: Never
EOF

###############################################################################
# Apply and describe the job
###############################################################################
kubectl apply -f cron-sleep-job.yaml
kubectl describe cronjobs.batch sleepy
kubectl delete cronjobs.batch sleepy
