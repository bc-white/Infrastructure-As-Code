#!/bin/bash
set -e

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script at $(date)"

# Update system
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Add Node.js 20 repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install all packages in one command
apt-get install -y \
  awscli \
  curl \
  jq \
  nginx \
  nodejs \
  unzip \
  wget

# Verify installations
node --version
npm --version
nginx -v

# Create application directories
mkdir -p \
  /etc/nginx/ssl \
  /opt/mocksurvey365-{api,app,portal,seniorliving}

# Generate self-signed certificates for each application
for app in api app portal seniorliving; do
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/$app.key \
    -out /etc/nginx/ssl/$app.crt \
    -subj "/C=US/O=InsPAC/CN=$app${environment}.${domain_name}"
done

# Fetch secrets from Secrets Manager
echo "Fetching secrets from Secrets Manager..."

# Redis credentials
REDIS_AUTH_TOKEN=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/redis-auth-token" \
  --query SecretString \
  --output text)

# JWT secret
JWT_SECRET=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/jwt-secret" \
  --query SecretString \
  --output text)

# API keys
EMAIL_API_KEY=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/email-api-key" \
  --query SecretString \
  --output text)

OPENAI_API_KEY=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/openai-api-key" \
  --query SecretString \
  --output text)

GAMMA_API_KEY=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/gamma-api-key" \
  --query SecretString \
  --output text)

TAVILY_API_KEY=$(aws secretsmanager get-secret-value \
  --region ${region} \
  --secret-id "${environment}/${org_name}/${project_name}/tavily-api-key" \
  --query SecretString \
  --output text)

# Fetch configuration from Parameter Store
echo "Fetching configuration from Parameter Store..."

APP_PORT=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/port" \
  --query Parameter.Value \
  --output text)

DB_CONNECTION=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/db-connection-string" \
  --query Parameter.Value \
  --output text)

API_BASE_URL=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/api-base-url" \
  --query Parameter.Value \
  --output text)

CP_URL=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/cp-url" \
  --query Parameter.Value \
  --output text)

SITE_LOGIN_URL=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/site-login-url" \
  --query Parameter.Value \
  --output text)

REDIS_DB=$(aws ssm get-parameter \
  --region ${region} \
  --name "/${environment}/${org_name}/${project_name}/redis-db" \
  --query Parameter.Value \
  --output text)

REDIS_ENDPOINT="${redis_endpoint}"

# Configure nginx for all applications
cat > /etc/nginx/sites-available/mocksurvey365 <<'EOF'
# API - Reverse proxy to localhost:8000
server {
    listen 3000 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/api.crt;
    ssl_certificate_key /etc/nginx/ssl/api.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/api-access.log;
    error_log /var/log/nginx/api-error.log;

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# App - Static site
server {
    listen 3001 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/app.crt;
    ssl_certificate_key /etc/nginx/ssl/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /opt/mocksurvey365-app/dist;
    index index.html;

    access_log /var/log/nginx/app-access.log;
    error_log /var/log/nginx/app-error.log;

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Portal - Static site
server {
    listen 3002 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/portal.crt;
    ssl_certificate_key /etc/nginx/ssl/portal.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /opt/mocksurvey365-portal/dist;
    index index.html;

    access_log /var/log/nginx/portal-access.log;
    error_log /var/log/nginx/portal-error.log;

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Senior Living - Static site
server {
    listen 3003 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/seniorliving.crt;
    ssl_certificate_key /etc/nginx/ssl/seniorliving.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /opt/mocksurvey365-seniorliving/dist;
    index index.html;

    access_log /var/log/nginx/seniorliving-access.log;
    error_log /var/log/nginx/seniorliving-error.log;

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable nginx site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/mocksurvey365 /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Create .env file for API
cat > /opt/mocksurvey365-api/.env <<EOF
PORT=$APP_PORT
ENV=${environment}
DB=$DB_CONNECTION
AWS_BUCKET_NAME=${uploads_bucket}
AWS_REGION=${region}
JWT_SECRET=$JWT_SECRET
API_BASE_URL=$API_BASE_URL
CP_URL=$CP_URL
SITE_LOGIN_URL=$SITE_LOGIN_URL
EMAIL_API_KEY=$EMAIL_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
GAMMA_API_KEY=$GAMMA_API_KEY
TAVILY_API_KEY=$TAVILY_API_KEY
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_AUTH_TOKEN
REDIS_DB=$REDIS_DB
EOF

# Create systemd service for API
cat > /etc/systemd/system/mocksurvey365-api.service <<'EOF'
[Unit]
Description=MockSurvey365 API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/mocksurvey365-api
EnvironmentFile=/opt/mocksurvey365-api/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mocksurvey365-api

[Install]
WantedBy=multi-user.target
EOF

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/api-access.log",
            "log_group_name": "${api_log_group}",
            "log_stream_name": "{instance_id}/nginx-access",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/api-error.log",
            "log_group_name": "${api_log_group}",
            "log_stream_name": "{instance_id}/nginx-error",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "${api_log_group}",
            "log_stream_name": "{instance_id}/user-data",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "MockSurvey365/${environment}",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Function to pull and extract artifacts from S3
pull_artifacts() {
  local app_name=$1
  local app_dir=$2

  echo "Pulling artifacts for $app_name..."

  # List and get the latest artifact
  LATEST_ARTIFACT=$(aws s3 ls s3://${artifacts_bucket}/${environment}/$app_name/ --recursive | \
    grep "\.tar\.gz$" | \
    sort | \
    tail -n 1 | \
    awk '{print $4}')

  if [ -z "$LATEST_ARTIFACT" ]; then
    echo "No artifacts found for $app_name"
    return 1
  fi

  echo "Downloading $LATEST_ARTIFACT..."
  aws s3 cp s3://${artifacts_bucket}/$LATEST_ARTIFACT /tmp/$app_name.tar.gz

  echo "Extracting to $app_dir..."
  tar -xzf /tmp/$app_name.tar.gz -C $app_dir
  rm /tmp/$app_name.tar.gz

  # Set proper permissions
  chown -R www-data:www-data $app_dir

  echo "Successfully deployed $app_name"
}

# Pull artifacts for all applications
pull_artifacts "mocksurvey365-api" "/opt/mocksurvey365-api"
pull_artifacts "mocksurvey365-app" "/opt/mocksurvey365-app"
pull_artifacts "mocksurvey365-portal" "/opt/mocksurvey365-portal"
pull_artifacts "mocksurvey365-seniorliving" "/opt/mocksurvey365-seniorliving"

# Start services
systemctl daemon-reload
systemctl enable mocksurvey365-api
systemctl start mocksurvey365-api
systemctl enable nginx
systemctl restart nginx

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Wait for services to start
sleep 10

# Verify services are running
systemctl status mocksurvey365-api --no-pager
systemctl status nginx --no-pager

echo "User data script completed successfully at $(date)"
