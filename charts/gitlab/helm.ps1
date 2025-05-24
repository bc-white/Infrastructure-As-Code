helm install gitlab gitlab/gitlab `
    --set global.hosts.domain="gitlab.bogartlab.com" `
    --set installCertmanager=false