helm install gitlab gitlab/gitlab `
    -f gitlab-values.yml `
    --version 9.0.1 `
    --timeout 600s `
    --namespace gitlab