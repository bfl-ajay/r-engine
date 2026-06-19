# Deployment Architecture - Reporting Engine

**Document Version:** 1.0  
**Date:** 2026-06-19  
**Status:** Final

---

## 1. Deployment Overview

### 1.1 Deployment Options
- **Cloud**: AWS, Azure, Google Cloud Platform
- **On-Premise**: Self-hosted Kubernetes cluster
- **Hybrid**: Multi-cloud deployment
- **SaaS**: Fully managed platform (future)

### 1.2 Environments
- **Development**: Local development with Docker Compose
- **Staging**: Pre-production testing environment
- **Production**: Live production environment
- **DR (Disaster Recovery)**: Geographically isolated backup

---

## 2. Infrastructure Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   AWS/Azure/GCP                            │
│                 (Cloud Provider)                           │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CDN (CloudFront/Azure CDN/Cloud CDN)              │  │
│  │  - Serve static assets                              │  │
│  │  - DDoS protection                                  │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  WAF (Web Application Firewall)                     │  │
│  │  - Rate limiting                                    │  │
│  │  - DDoS mitigation                                  │  │
│  │  - Attack pattern blocking                          │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  Load Balancer (ALB/NLB)                            │  │
│  │  - HTTPS termination                                │  │
│  │  - SSL/TLS encryption                               │  │
│  │  - Path-based routing                               │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │         VPC (Virtual Private Cloud)                 │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  Public Subnet (API Gateway)                │   │  │
│  │  │  - NAT Gateway (outbound access)            │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                     │                               │  │
│  │  ┌────────────────┬─┴──┬────────────┐              │  │
│  │  │                │    │            │              │  │
│  │  ▼                ▼    ▼            ▼              │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  Private Subnet (Kubernetes Cluster)       │   │  │
│  │  │                                             │   │  │
│  │  │  ┌─────────────────────────────────────┐   │   │  │
│  │  │  │  Worker Node 1 (Pod)                │   │   │  │
│  │  │  │  - API Service instances            │   │   │  │
│  │  │  │  - Background job workers           │   │   │  │
│  │  │  └─────────────────────────────────────┘   │   │  │
│  │  │                                             │   │  │
│  │  │  ┌─────────────────────────────────────┐   │   │  │
│  │  │  │  Worker Node 2 (Pod)                │   │   │  │
│  │  │  │  - API Service instances            │   │   │  │
│  │  │  │  - Background job workers           │   │   │  │
│  │  │  └─────────────────────────────────────┘   │   │  │
│  │  │                                             │   │  │
│  │  │  ┌─────────────────────────────────────┐   │   │  │
│  │  │  │  Worker Node 3 (Pod)                │   │   │  │
│  │  │  │  - API Service instances            │   │   │  │
│  │  │  │  - Background job workers           │   │   │  │
│  │  │  └─────────────────────────────────────┘   │   │  │
│  │  │                                             │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  Data & Cache Tier (Private Subnet)        │   │  │
│  │  │  - PostgreSQL cluster                       │   │  │
│  │  │  - Redis cluster                            │   │  │
│  │  │  - RabbitMQ cluster                         │   │  │
│  │  │  - S3/Blob storage (internal access)        │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Kubernetes Deployment

### 3.1 Cluster Configuration

**Cluster Specs:**
- **Node Count**: 3-5 worker nodes (auto-scaling: 1-10)
- **Node Type**: 4 CPU, 8GB RAM (adjust based on workload)
- **Kubernetes Version**: 1.28+
- **Container Runtime**: containerd or docker
- **Storage Class**: EBS (AWS), Managed Disks (Azure), Persistent Disks (GCP)

### 3.2 Namespace Strategy

```
Kubernetes Cluster
├── default (system components)
├── kube-system
├── kube-public
├── reporting-engine-dev
│   ├── api-gateway
│   ├── report-services
│   ├── data-services
│   ├── databases
│   └── message-queues
├── reporting-engine-staging
│   └── (same structure)
└── reporting-engine-prod
    └── (same structure)
```

### 3.3 Service Architecture

#### 3.3.1 API Gateway Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: reporting-engine-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: reporting-engine/api-gateway:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 5
```

#### 3.3.2 Service Exposure

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: reporting-engine-prod
spec:
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 443
    targetPort: 8080
  selector:
    app: api-gateway
```

### 3.4 Database Deployment

#### 3.4.1 PostgreSQL StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
  namespace: reporting-engine-prod
spec:
  serviceName: postgresql-headless
  replicas: 1  # Primary (replicas managed externally for HA)
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: reporting_engine
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        volumeMounts:
        - name: postgresql-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 2000m
            memory: 4Gi
          limits:
            cpu: 4000m
            memory: 8Gi
  volumeClaimTemplates:
  - metadata:
      name: postgresql-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: ebs-gp3
      resources:
        requests:
          storage: 500Gi
```

### 3.5 Message Queue Deployment

#### 3.5.1 RabbitMQ StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
  namespace: reporting-engine-prod
spec:
  serviceName: rabbitmq
  replicas: 3  # High availability cluster
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3.12-management
        ports:
        - containerPort: 5672
          name: amqp
        - containerPort: 15672
          name: management
        env:
        - name: RABBITMQ_DEFAULT_USER
          valueFrom:
            secretKeyRef:
              name: rabbitmq-credentials
              key: username
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: rabbitmq-credentials
              key: password
        - name: RABBITMQ_ERLANG_COOKIE
          valueFrom:
            secretKeyRef:
              name: rabbitmq-credentials
              key: erlang-cookie
        volumeMounts:
        - name: rabbitmq-storage
          mountPath: /var/lib/rabbitmq
```

### 3.6 Cache Deployment

#### 3.6.1 Redis Cluster

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-cluster
  namespace: reporting-engine-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - "--cluster-enabled"
        - "yes"
        - "--cluster-config-file"
        - "/data/nodes.conf"
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
```

---

## 4. Configuration Management

### 4.1 ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: reporting-engine-config
  namespace: reporting-engine-prod
data:
  DATABASE_POOL_SIZE: "20"
  CACHE_TTL: "3600"
  LOG_LEVEL: "info"
  ENVIRONMENT: "production"
  API_TIMEOUT: "30000"
  MAX_REPORT_SIZE: "1000000000"
```

### 4.2 Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: reporting-engine-secrets
  namespace: reporting-engine-prod
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgresql:5432/reporting_engine"
  REDIS_URL: "redis://redis-cluster:6379"
  JWT_SECRET: "your-secret-key-here"
  OAUTH_CLIENT_ID: "client-id"
  OAUTH_CLIENT_SECRET: "client-secret"
  VAULT_TOKEN: "vault-token"
```

### 4.3 Environment Variants

**Development Environment:**
```yaml
DATABASE_POOL_SIZE: "5"
LOG_LEVEL: "debug"
CACHE_TTL: "300"
REPLICAS: 1
```

**Production Environment:**
```yaml
DATABASE_POOL_SIZE: "100"
LOG_LEVEL: "info"
CACHE_TTL: "3600"
REPLICAS: 3
AUTO_SCALING_MIN: 3
AUTO_SCALING_MAX: 10
```

---

## 5. High Availability & Disaster Recovery

### 5.1 Database High Availability

**PostgreSQL Replication:**
```
Primary DB (Write) → Streaming Replication → Standby 1
                                          → Standby 2
                                          → Standby 3
```

- **RPO (Recovery Point Objective)**: 5 minutes
- **RTO (Recovery Time Objective)**: 1 minute
- Automated failover to standby
- Regular backups to object storage

### 5.2 Service Redundancy
- Multiple API Gateway instances (3+)
- Load balancer health checks every 5 seconds
- Auto-recovery for failed instances
- Cross-availability zone deployment

### 5.3 Backup Strategy

#### 5.3.1 Database Backups
```
Backup Type       Frequency       Retention       Storage
════════════════════════════════════════════════════════════════
Full Backup       Daily (2 AM)    30 days         S3/Azure Blob
Incremental       Every 6 hours   7 days          S3/Azure Blob
Transaction Log   Every hour      30 days         S3/Azure Blob
Point-in-time     Continuous      7 days          Primary DB
```

#### 5.3.2 Backup Validation
```bash
# Weekly backup restoration test
# Verify data integrity
# Test recovery procedures
```

### 5.4 Disaster Recovery Sites

**Primary Region**: US-East (us-east-1)
**DR Region**: US-West (us-west-2)
**RTO**: 1 hour
**RPO**: 15 minutes

---

## 6. Monitoring & Logging

### 6.1 Monitoring Stack

```
Application Metrics (Prometheus)
              ↓
   ┌──────────┴──────────┐
   ↓                     ↓
Time Series DB      Visualization
(Prometheus)        (Grafana)
                         ↓
                    Dashboard/Alerts
                         ↓
                    Alert Manager
                         ↓
                   Slack/PagerDuty
```

### 6.2 Key Metrics to Monitor

| Metric | Alert Threshold | Owner |
|--------|---|---|
| CPU Usage | > 80% | DevOps |
| Memory Usage | > 85% | DevOps |
| Disk Usage | > 80% | DevOps |
| API Response Time | > 1000ms | Backend Team |
| Error Rate | > 1% | Backend Team |
| Database Connection Pool | > 90% | DBA |
| Queue Depth | > 10000 | Backend Team |
| Report Generation Time | > 5 min (p95) | Performance Team |

### 6.3 Logging Stack

```
Application Logs (JSON format)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Fluentd/Logstash    Stdout
    ↓                   
Elasticsearch       Container
    ↓              Runtime
    ├─ Kibana (Visualization)
    └─ Alerts
```

### 6.4 Distributed Tracing

```
Request → API Gateway → Report Service → Database
  │          │              │              │
  └──────────┴──────────────┴──────────────┘
          Jaeger/Zipkin (Trace Collector)
                      ↓
            Trace Analysis & Visualization
```

---

## 7. CI/CD Pipeline

### 7.1 Pipeline Stages

```
Code Push (GitHub/GitLab)
        ↓
┌─────────────────────────┐
│ 1. Build & Test         │
│  - Unit tests           │
│  - Integration tests    │
│  - Code coverage        │
│  - SAST scan            │
│  - Dependency check     │
└──────────┬──────────────┘
           ↓ (if all pass)
┌─────────────────────────┐
│ 2. Build Artifacts      │
│  - Docker image build   │
│  - Container scan       │
│  - Push to registry     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ 3. Deploy to Staging    │
│  - Run migrations       │
│  - E2E tests            │
│  - Smoke tests          │
│  - Performance tests    │
└──────────┬──────────────┘
           ↓ (manual approval)
┌─────────────────────────┐
│ 4. Deploy to Production │
│  - Blue-green deploy    │
│  - Health checks        │
│  - Smoke tests          │
│  - Rollback ready       │
└─────────────────────────┘
```

### 7.2 Deployment Strategy: Blue-Green

```
┌─────────────────────────────────┐
│  Before Deployment              │
│                                 │
│  BLUE (Current 100%)            │
│  - 3 pods running v2.0          │
│  - Handling all traffic         │
│  - Database version 5           │
│                                 │
└─────────────────────────────────┘
        ↓ (Deploy new version)
┌─────────────────────────────────┐
│  During Deployment              │
│                                 │
│  BLUE (Current)         GREEN   │
│  - 3 pods v2.0          - 3 pods v2.1
│  - 100% traffic         - 0% traffic
│  - Version 5 DB         - Version 5 DB
│  - Ready for rollback   - Testing
│                                 │
└─────────────────────────────────┘
        ↓ (Health checks pass)
┌─────────────────────────────────┐
│  After Deployment               │
│                                 │
│  GREEN (Current 100%)           │
│  - 3 pods running v2.1          │
│  - Handling all traffic         │
│  - Database version 5           │
│  - BLUE kept for rollback       │
│                                 │
└─────────────────────────────────┘
```

### 7.3 Canary Deployment (Alternative)

```
Current Version v2.0: 95% traffic
New Version v2.1: 5% traffic (monitoring metrics)
  ↓ (if metrics good)
Current Version v2.0: 50% traffic
New Version v2.1: 50% traffic (continued monitoring)
  ↓ (if metrics good)
Current Version v2.0: 0% traffic
New Version v2.1: 100% traffic
```

---

## 8. Docker Configuration

### 8.1 Dockerfile Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm ci --production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["node", "dist/index.js"]
```

### 8.2 Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: reporting_engine_dev
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: "postgresql://devuser:devpass@postgres:5432/reporting_engine_dev"
      REDIS_URL: "redis://redis:6379"
      RABBITMQ_URL: "amqp://guest:guest@rabbitmq:5672"
      NODE_ENV: development
    depends_on:
      - postgres
      - redis
      - rabbitmq

volumes:
  postgres_data:
```

---

## 9. Infrastructure as Code

### 9.1 Terraform Main Configuration

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  backend "s3" {
    bucket         = "reporting-engine-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "reporting-engine-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name            = "reporting-engine-cluster"
  role_arn        = aws_iam_role.eks_cluster_role.arn
  version         = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  allocated_storage    = 500
  storage_type         = "gp3"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.r6g.xlarge"
  db_name              = "reporting_engine"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = false
  backup_retention_period = 30

  multi_az            = true
  storage_encrypted   = true
  publicly_accessible = false

  tags = {
    Name = "reporting-engine-db"
  }
}
```

---

## 10. Scaling Strategy

### 10.1 Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: reporting-engine-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 300
```

### 10.2 Vertical Pod Autoscaling (VPA) - Optional

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-gateway-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: api-gateway
  updatePolicy:
    updateMode: "Auto"
```

---

## 11. Rollback Procedures

### 11.1 Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/api-gateway -n reporting-engine-prod

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n reporting-engine-prod

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=3 -n reporting-engine-prod
```

### 11.2 Database Rollback

```sql
-- If migrations failed, restore from backup
-- Point-in-time recovery to pre-deployment state
SELECT pg_restore(backup_id, '2026-06-19 15:00:00');
```

---

## 12. Network Policies

### 12.1 Ingress Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-gateway
  namespace: reporting-engine-prod
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
```

### 12.2 Egress Traffic

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external-apis
  namespace: reporting-engine-prod
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: reporting-engine-prod
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
    - protocol: TCP
      port: 5672  # RabbitMQ
```

---

## 13. Cost Optimization

### 13.1 Resource Requests & Limits

```
Service Type        CPU Request    CPU Limit    Memory Request    Memory Limit
═════════════════════════════════════════════════════════════════════════════
API Gateway        500m           1000m        512Mi              1Gi
Report Service     1000m          2000m        1Gi                2Gi
Data Service       500m           1000m        512Mi              1Gi
Script Engine      1000m          2000m        1Gi                2Gi
Database           2000m          4000m        4Gi                8Gi
Redis             250m            500m         512Mi              1Gi
```

### 13.2 Cost Monitoring
- Daily cost reports per service
- Unused resource identification
- Reserved instance optimization
- Spot instance usage for non-critical workloads

---

**End of Document**
