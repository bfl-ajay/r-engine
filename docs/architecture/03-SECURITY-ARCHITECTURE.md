# Security Architecture - Reporting Engine

**Document Version:** 1.0  
**Date:** 2026-06-19  
**Status:** Final

---

## 1. Security Overview

This document defines the security architecture for the Reporting Engine, covering authentication, authorization, data protection, API security, and compliance requirements.

### 1.1 Security Principles
- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Users/services have minimum necessary permissions
- **Zero Trust**: All access requests verified regardless of source
- **Confidentiality**: Data encrypted in transit and at rest
- **Integrity**: Tamper detection and validation
- **Availability**: DDoS mitigation and resource protection

---

## 2. Authentication Architecture

### 2.1 Authentication Methods

#### 2.1.1 Local Authentication
- Email/password authentication
- Passwords hashed with bcrypt (cost factor: 12)
- Account lockout after 5 failed attempts
- Password expiration: 90 days
- Minimum password requirements:
  - 12 characters minimum
  - Mix of uppercase, lowercase, digits, special characters

#### 2.1.2 OAuth 2.0 / OpenID Connect
- Support for Google, Azure AD, GitHub OAuth providers
- PKCE flow for native/SPA applications
- Authorization code flow for server applications
- Token refresh cycle (15-minute access token, 7-day refresh token)

#### 2.1.3 SAML 2.0
- Enterprise SSO integration
- Service Provider (SP) configuration
- Assertion validation and encryption
- NameID mapping to local users

#### 2.1.4 LDAP/Active Directory
- Corporate directory integration
- Bind with user credentials
- User attribute mapping
- Group membership synchronization

### 2.2 JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "roles": ["user", "report_designer"],
    "permissions": ["report:create", "report:read"],
    "iat": 1624080000,
    "exp": 1624083600,
    "iss": "reporting-engine",
    "aud": "web-app"
  }
}
```

### 2.3 Token Management

| Token Type | Lifetime | Refresh | Storage |
|-----------|----------|---------|---------|
| Access Token | 15 minutes | Automatic | Memory |
| Refresh Token | 7 days | Manual | HttpOnly Cookie |
| Session Token | 8 hours | Automatic | Redis |

### 2.4 Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password) via authenticator apps
- SMS-based 2FA as fallback
- WebAuthn/FIDO2 support
- Recovery codes for account recovery

---

## 3. Authorization Architecture

### 3.1 Role-Based Access Control (RBAC)

#### 3.1.1 Predefined Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Admin** | All system operations | System administrators |
| **Report Designer** | Create/edit reports, manage templates, execute reports | Report designers |
| **Report Viewer** | Execute and view reports | End users |
| **Data Manager** | Configure data sources, manage credentials | Data administrators |
| **Auditor** | View audit logs, system configuration | Compliance/audit team |

#### 3.1.2 Custom Roles
- Create custom roles with specific permission combinations
- Role hierarchy support
- Role descriptions and documentation

### 3.2 Permission Structure

```
Resource       Action         Permission Code
━━━━━━━━━━━━   ━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━
report         create         report:create
report         read           report:read
report         update         report:update
report         delete         report:delete
report         execute        report:execute
template       manage         template:manage
datasource     manage         datasource:manage
user           manage         user:manage
audit          read           audit:read
config         manage         config:manage
```

### 3.3 Fine-Grained Authorization

#### 3.3.1 Resource-Level Access
```typescript
interface ResourcePermission {
  userId: string;
  resourceType: 'report' | 'template' | 'datasource';
  resourceId: string;
  permissions: ('read' | 'write' | 'delete' | 'share')[];
  grantedBy: string;
  grantedAt: Date;
}
```

#### 3.3.2 Field-Level Security
- Mask sensitive columns in query results
- Hide PII fields from unauthorized users
- Sensitive data audit logging

#### 3.3.3 Data Row-Level Security
```sql
-- PostgreSQL RLS Policy Example
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_reports_policy ON reports
  FOR SELECT USING (
    created_by = current_user_id OR
    id IN (SELECT resource_id FROM permissions 
           WHERE user_id = current_user_id AND resource_type = 'report')
  );
```

### 3.4 Authorization Enforcement
- Every API request validated against user permissions
- Permission evaluation in API gateway
- Service-to-service authorization via service accounts
- Audit logging of authorization decisions

---

## 4. Data Protection

### 4.1 Encryption in Transit
- **TLS 1.3** for all network communication
- Perfect Forward Secrecy (PFS) enabled
- Certificate pinning for mobile applications
- HSTS (HTTP Strict Transport Security) headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 4.2 Encryption at Rest

#### 4.2.1 Database Encryption
- PostgreSQL Transparent Data Encryption (TDE) or equivalent
- AES-256 encryption key management
- Key rotation: Every 90 days
- Separate keys per environment (dev/staging/prod)

#### 4.2.2 Credential Encryption
```
Storage Location          Encryption Method       Key Management
════════════════════════  ═════════════════════   ══════════════════════
Database (credentials)    AES-256-GCM            HashiCorp Vault
Environment variables    Sealed at build time    Kubernetes Secrets
File system (temp)       AES-256-GCM            OS-level encryption
Cache (Redis)            At-rest encryption      TLS + ACLs
```

#### 4.2.3 Sensitive Data Classification

| Classification | Examples | Encryption | Audit |
|---|---|---|---|
| **Confidential** | Passwords, API keys, DB credentials | AES-256 | Full |
| **Restricted** | User data, report contents | AES-128 | Sampled |
| **Internal** | System configuration | Optional | Basic |
| **Public** | Documentation, schemas | None | None |

### 4.3 Key Management

#### 4.3.1 Key Storage
- HSM (Hardware Security Module) for master keys
- HashiCorp Vault for application secrets
- Automated key rotation
- Secure key backup with offline storage

#### 4.3.2 Key Rotation Policy
- Master keys: Quarterly rotation
- Application keys: Semi-annual rotation
- Emergency rotation: On compromise

### 4.4 Data Masking

```typescript
// Sensitive field masking in logs/output
interface MaskingRules {
  email: /(?<=.)[^@]*(?=@)/g,      // user***@example.com
  phone: /(?<=\d{3})\d{6}(?=\d{4})/g,  // ***-***-1234
  creditCard: /\d(?=(?:\d{4})*$)/g,    // **-**-**-1234
  ssn: /(?<=\d)\d{5}/,             // 123-**-6789
  apiKey: /.{16}$/                 // API_***...***
}
```

---

## 5. API Security

### 5.1 API Gateway Security

#### 5.1.1 Authentication & Authorization
- JWT token validation on every request
- API key authentication for service-to-service calls
- OAuth 2.0 token validation
- Rate limiting per user/API key

#### 5.1.2 Input Validation
```typescript
// Request validation at gateway level
interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'date' | 'email' | 'uuid';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}
```

#### 5.1.3 Output Filtering
- Remove sensitive headers before sending to clients
- Content-Security-Policy (CSP) headers
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff

### 5.2 SQL Injection Prevention
- Parameterized queries for all database access
- ORM validation and escaping
- Input type checking
- Query logging and review for suspicious patterns

### 5.3 Cross-Site Scripting (XSS) Prevention
- Input sanitization using DOMPurify
- Output encoding (HTML, URL, JavaScript context-aware)
- Content Security Policy (CSP) headers
- X-XSS-Protection headers

### 5.4 Cross-Site Request Forgery (CSRF) Prevention
- CSRF tokens for state-changing operations
- SameSite cookie attribute (SameSite=Strict)
- Double-Submit Cookie pattern for SPAs

### 5.5 API Rate Limiting

```
User Type              Requests/Hour    Burst     Threshold Action
════════════════════   ═════════════    ════════  ════════════════════════
Free User              100              10        Throttle, then block
Pro User               1,000            50        Throttle, then block
Enterprise             Unlimited        500       Log and alert
Service Account        Variable         Variable  Based on tier
Anonymous              10               1         Immediate block
```

---

## 6. Network Security

### 6.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet                                │
└────────────────────────┬──────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   WAF   │ (Web Application Firewall)
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      ┌─────▼────┐           ┌──────▼──────┐
      │ API GW 1 │           │ API GW 2    │ (Load Balanced)
      └─────┬────┘           └──────┬──────┘
            │                       │
      ┌─────┴───────────────────────┴────┐
      │                                   │
   ┌──▼──┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Svc1 │  │Svc2  │  │Svc3  │  │Svc4  │ (Microservices)
   └──┬──┘  └──┬───┘  └──┬───┘  └──┬───┘
      │        │        │        │
   ┌──▼────────▼────────▼────────▼──┐
   │                                  │
   │    Private Network (VPC)         │
   │                                  │
   │  ┌──────────┐    ┌─────────┐   │
   │  │ Database │    │  Redis  │   │
   │  └──────────┘    └─────────┘   │
   │                                  │
   └──────────────────────────────────┘
```

### 6.2 Firewall Rules
- Ingress: HTTPS (443), SSH (22, restricted to admins)
- Egress: Outbound to configured data sources only
- Internal: Service-to-service communication on defined ports
- Block all other traffic

### 6.3 DDoS Mitigation
- CloudFlare/AWS Shield for DDoS protection
- Rate limiting at API gateway
- IP reputation checking
- Anomaly detection

### 6.4 Network Segmentation
- Separate VPCs for dev/staging/production
- Database in private subnet (no direct internet access)
- Redis cache in private subnet
- Bastion host for admin access

### 6.5 SSL/TLS Configuration

```
Protocol Version:        TLS 1.3 minimum (1.2 supported for legacy)
Cipher Suites:          ECDHE-based suites only
Key Exchange:           Elliptic Curve (P-256, P-384, P-521)
Authentication:         RSA or ECDSA (minimum 256-bit)
Encryption:             AES-GCM (128 or 256-bit)
Integrity:              AEAD (Authenticated Encryption)
Certificate Authority:   Trusted CA (Let's Encrypt or commercial)
Certificate Pinning:    For mobile applications
```

---

## 7. Audit & Logging

### 7.1 Audit Logging

**All Events Logged:**
- User login/logout
- Report creation, modification, deletion
- Report execution
- Data export
- User permission changes
- System configuration changes
- Failed authorization attempts
- Data access for PII fields

**Audit Log Entry Structure:**
```json
{
  "eventId": "uuid",
  "timestamp": "2026-06-19T10:00:00Z",
  "userId": "user-uuid",
  "action": "report.created",
  "resourceType": "report",
  "resourceId": "report-uuid",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "status": "success",
  "details": {
    "reportName": "Sales Analysis",
    "templateId": "template-uuid"
  }
}
```

### 7.2 Logging Standards

```
Level        Usage Pattern                    Retention
═════════════════════════════════════════════════════════════════
DEBUG        Development/troubleshooting      7 days
INFO         Business events                 90 days
WARNING      Potential issues                1 year
ERROR        Error conditions                2 years
CRITICAL     Security events/failures        5 years
```

### 7.3 Log Storage & Analysis
- Centralized logging (ELK Stack, Splunk, or Datadog)
- Immutable log storage for compliance
- Real-time alerting on suspicious patterns
- Long-term archive for regulatory requirements

### 7.4 Sensitive Data in Logs
- Never log passwords or API keys
- Mask credit cards, SSNs, PII
- Log data access decisions, not actual PII

---

## 8. Vulnerability Management

### 8.1 Security Scanning

#### 8.1.1 Source Code Scanning
- Static Application Security Testing (SAST)
- Tools: SonarQube, Veracode, Checkmarx
- Frequency: Every commit
- Threshold: High/Critical severity blocks deployment

#### 8.1.2 Dependency Scanning
- Software Composition Analysis (SCA)
- Tools: Dependabot, Snyk, WhiteSource
- Frequency: Continuous
- Policy: Update vulnerable dependencies within 7 days

#### 8.1.3 Dynamic Testing
- Dynamic Application Security Testing (DAST)
- Tools: OWASP ZAP, Burp Suite
- Frequency: Pre-release
- Targets: All APIs and web interfaces

#### 8.1.4 Container Scanning
- Container image vulnerability scanning
- Registry scanning (Docker Hub, ECR)
- Frequency: On build and daily
- Block deployment of critical vulnerabilities

### 8.2 Patch Management
- Regular OS/framework updates
- Security patch SLA: Critical (24 hours), High (1 week)
- Testing before production deployment
- Automated patching for non-breaking updates

### 8.3 Penetration Testing
- Annual professional penetration tests
- Quarterly internal security assessments
- Bug bounty program
- Incident response testing

---

## 9. Compliance & Standards

### 9.1 Compliance Requirements

| Framework | Applicability | Key Requirements |
|-----------|---|---|
| **GDPR** | EU users | Data processing agreements, DPO, breach notification |
| **HIPAA** | Healthcare data | Encryption, audit logs, access controls |
| **SOC 2** | Enterprise customers | Security, availability, integrity |
| **ISO 27001** | Information security | ISMS, risk assessment, incident management |
| **PCI-DSS** | Payment data | Encryption, network segmentation |

### 9.2 Data Residency
- Option to specify data storage location
- EU data stays in EU (GDPR)
- Australia data stays in Australia (Privacy Act)
- Cross-border data transfer restrictions

### 9.3 Data Retention & Deletion
- User data: 90 days after account deletion
- Audit logs: 7 years
- Report execution data: 1 year
- Automated cleanup processes

---

## 10. Incident Response

### 10.1 Security Incident Classification

| Severity | Examples | Response Time | Escalation |
|----------|----------|---|---|
| **Critical** | Data breach, RCE | 15 minutes | CEO, Legal, PR |
| **High** | DoS, auth bypass | 1 hour | CISO, InfoSec |
| **Medium** | Unauthorized access | 4 hours | Team Lead |
| **Low** | Misconfiguration | 1 day | Team |

### 10.2 Incident Response Plan
1. **Detection**: Automated alerts, user reports
2. **Containment**: Isolate affected systems
3. **Investigation**: Root cause analysis
4. **Recovery**: Restore from backup
5. **Notification**: User/regulatory notification if required
6. **Post-Mortem**: Improvement recommendations

### 10.3 Data Breach Response
- Notification within 72 hours (GDPR requirement)
- Determine if encryption was effective
- Legal review before notification
- Regulatory reporting (if applicable)
- Offer credit monitoring (for exposed personal data)

---

## 11. Third-Party Security

### 11.1 Vendor Assessment
- Security questionnaire review
- SOC 2 certification verification
- Penetration testing reports
- Financial stability check

### 11.2 API Integration Security
- Validate API certificates
- Rate limiting for external APIs
- Timeout configuration
- Error handling without leaking details
- Regular security updates for API clients

---

## 12. Security Monitoring

### 12.1 Security Metrics

```
Metric                            Target          Alert Threshold
══════════════════════════════════════════════════════════════════════
Failed Login Attempts/Hour        < 100           > 500
Password Reset Requests/Hour      < 50            > 200
API Error Rate                    < 0.1%          > 1%
Certificate Expiry Warning        30 days         < 7 days
Patch Compliance                  100%            < 95%
Vulnerability Mean Time to Fix    < 7 days        > 14 days
```

### 12.2 Security Alerts
- Failed authentication threshold
- Unauthorized access attempts
- API quota exceeded
- Certificate expiration
- Intrusion detection signatures
- Data exfiltration patterns

---

## 13. Security Testing Roadmap

| Phase | Timeline | Activities |
|-------|----------|-----------|
| **Phase 1** | Month 1-2 | SAST/SCA setup, basic penetration test |
| **Phase 2** | Month 3-4 | DAST integration, threat modeling |
| **Phase 3** | Month 5-6 | SOC 2 audit, bug bounty launch |
| **Phase 4** | Month 7-12 | Annual pentesting, GDPR compliance |

---

**End of Document**
