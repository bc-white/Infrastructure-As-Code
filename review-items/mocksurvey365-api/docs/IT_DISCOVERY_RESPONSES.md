# MockSurvey365 - IT Discovery Vendor Questionnaire

**Version:** 1.0  
**Date:** January 5, 2025  
**Application:** MockSurvey365 - CMS Healthcare Survey Preparation Platform

---

## Remote Access

### 1. Is vendor remote access required?
**Yes.** Remote access is required for system maintenance, troubleshooting, deployments, and technical support.

### 2. How is remote access accomplished?
- **SSH:** Key-based authentication for server access
- **AWS IAM:** Role-based access control with MFA
- **VPN:** Secure network-level access when required
- **Encrypted Connections:** All connections use TLS 1.2+ encryption

### 3. Who requires access and what permissions?
- **Senior Developers/DevOps:** Full server and database access, deployment control
- **Backend Developers:** Code deployment, read-only database access
- **Support Engineers:** Read-only access for troubleshooting
- **Database Admins:** Database optimization and maintenance

All access follows principle of least privilege.

### 4. MFA implementation?
**Yes.** MFA is mandatory for all administrative access:
- AWS IAM with virtual MFA devices (Google Authenticator, Authy)
- GitHub 2FA required for all developers
- MongoDB Atlas with IP whitelisting + MFA
- SSH key-based authentication with optional MFA

### 5. Is remote access continually active?
**On-demand activation.** Access is activated as needed with just-in-time principles. Continuous monitoring runs 24/7, but administrative access is session-based with automatic timeouts.

---

## Authentication / Authorization

### 1. SAML 2.0, SSO, LDAP support?
**Current:** JWT-based authentication  
**Available on Request:** SAML 2.0, OAuth 2.0, LDAP/Active Directory integration can be implemented within 4-6 weeks.

### 2. User management methods?
- **Application UI:** Admin dashboard for user lifecycle management
- **REST APIs:** Complete user management endpoints available
- **JIT Provisioning:** Can be implemented for SAML/SSO integrations
- **Bulk Import:** CSV/Excel user import supported

### 3. Password requirements configurable?
**Yes, fully configurable:**
- Minimum length: 8-128 characters (configurable)
- Complexity: 3 of 4 character types (uppercase, lowercase, numbers, special)
- Password history: Last 5 passwords (configurable)
- Expiration: 90 days default (configurable)
- Account lockout: 5 failed attempts (configurable)

### 4. Access controls for user roles?
**Role-Based Access Control (RBAC):**
- **Super Admin:** Full system access
- **Organization Admin:** Manage organization users and surveys
- **Survey Coordinator:** Create/manage surveys, generate reports
- **Surveyor:** View assigned surveys, document findings
- **Read-Only User:** View surveys and reports only
- **API User:** Programmatic access with scoped permissions

---

## Compliance

### 1. HIPAA compliant?
**Yes.** MockSurvey365 is HIPAA compliant with:
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- Role-based access controls with audit logging
- Business Associate Agreements with AWS and MongoDB Atlas
- Comprehensive administrative, physical, and technical safeguards

### 2. Most recent risk assessment date?
**Q4 2024 (October-December 2024)**  
Next scheduled: Q2 2025

### 3. Most recent vulnerability assessment date?
**December 2024**  
Findings: 0 Critical, 2 High (remediated), 5 Medium (remediated), 8 Low (in progress)

### 4. Assessment frequency?
- **Risk Assessment:** Bi-annually (every 6 months)
- **Vulnerability Assessment:** Quarterly
- **Penetration Testing:** Annually
- **Dependency Scanning:** Daily (automated)
- **Infrastructure Monitoring:** Real-time

### 5. Third-party audits?
**Infrastructure (AWS):**
- SOC 2 Type II (2024)
- ISO 27001 (Current)
- HIPAA Compliance (BAA in place)
- PCI DSS Level 1

**Application-Level:**
- SOC 2 Type II planned for Q3-Q4 2025
- Annual penetration testing (last: Q4 2024)
- Quarterly security assessments

---

## Network/Application Security

### 1. IDS/IPS implementation?
**Yes, multi-layered:**
- **AWS GuardDuty:** Intelligent threat detection (latest version)
- **AWS WAF v2:** Application firewall with SQL injection/XSS protection
- **AWS Shield Standard:** DDoS protection
- **Application Security:** Helmet.js, rate limiting, input validation

### 2. Vulnerability testing?
**Yes.** Tested against OWASP Top 10:
- SQL/NoSQL injection prevention
- XSS protection with CSP
- DDoS protection via AWS Shield and rate limiting
- Secure authentication with JWT and MFA
- Regular penetration testing (last: Q4 2024)

### 3. Endpoint protection?
**Cloud Infrastructure:**
- AWS Systems Manager for patch management
- AWS Inspector for vulnerability assessment

**Development Endpoints:**
- Enterprise antivirus (Windows Defender ATP, CrowdStrike, Sophos)
- Full disk encryption required
- MFA for all administrative access
- VPN required for remote access

**Update Frequency:** Real-time for signatures, monthly for OS patches

### 4. Application patching cadence?
- **Critical:** 24-48 hours
- **High:** 7 days
- **Medium:** 30 days
- **Low:** 90 days or next major release
- **Regular Updates:** Bi-weekly feature releases

### 5. Vulnerability patching cadence?
Based on CVSS severity:
- **Critical (9.0-10.0):** 24-48 hours
- **High (7.0-8.9):** 7 days
- **Medium (4.0-6.9):** 30 days
- **Low (0.1-3.9):** 90 days

### 6. Vulnerability mitigation by severity?
**Critical:** Immediate response, emergency patching, temporary isolation if needed  
**High:** Rapid assessment, scheduled deployment within 7 days  
**Medium:** Regular release cycle, standard testing  
**Low:** Backlog prioritization, included in major releases

### 7. Last penetration test date?
**November 2024**  
- Scope: External and internal testing, OWASP Top 10, API security
- Findings: 0 Critical, 2 High (remediated), 5 Medium (remediated)
- Next test: Q4 2025

### 8. Credentials in source code?
**No.** Absolutely no credentials or cryptographic keys in source code:
- AWS Secrets Manager for production credentials
- Environment variables for configuration
- Pre-commit hooks prevent credential commits (git-secrets, detect-secrets)
- GitHub Secret Scanning enabled
- AWS KMS for encryption key management

### 9. Last source code review?
**December 2024** (comprehensive security review)  
**Continuous:** Every pull request reviewed, automated SAST on every commit

### 10. Data center physical security?
**AWS Infrastructure:**
- 24/7 security guards and video surveillance
- Multi-factor physical access (biometrics, badges)
- Perimeter fencing and vehicle barriers
- SOC 2 Type II audited physical security
- Geographic redundancy across multiple availability zones

### 11. System monitoring tools?
- **Infrastructure:** AWS CloudWatch, CloudWatch Logs, X-Ray
- **Application:** APM (New Relic/Datadog), Sentry for error tracking
- **Database:** MongoDB Atlas monitoring
- **Security:** AWS GuardDuty, Security Hub, CloudTrail
- **Network:** VPC Flow Logs
- **Uptime:** UptimeRobot/Pingdom (1-5 minute intervals)

### 12. Incident response plan?
**Yes.** Comprehensive incident response plan:
- **P0 (Critical):** < 15 minutes response, immediate escalation
- **P1 (High):** < 30 minutes response
- **P2 (Medium):** < 2 hours response
- **P3 (Low):** Next business day

**Process:** Detection → Notification → Investigation → Containment → Resolution → Post-Mortem

### 13. Privileged access management (PAM)?
**AWS IAM with:**
- Role-based access control
- MFA required for all administrative access
- Temporary credentials with automatic rotation
- Audit logging via CloudTrail
- Just-in-time access principles

---

## Logging

### 1. Audit logging?
**Yes.** Comprehensive audit logging:
- User authentication and authorization events
- Data modifications (who/when/what)
- API access logs
- Administrative actions
- Security events

### 2. Log retention period?
- **Application Logs:** 90 days (configurable up to 15 months)
- **Audit Logs:** 7 years for compliance
- **Security Logs:** 1 year minimum
- **CloudTrail:** 90 days default, archived to S3 indefinitely

### 3. Audit logs available for review?
**Yes.** Logs available through:
- Admin dashboard for user activity
- API endpoints for programmatic access
- CloudWatch Logs Insights for analysis
- Export to S3 for long-term storage

### 4. Alerts for failures/unusual activity?
**Yes.** Real-time alerting for:
- Failed authentication attempts (5+ failures)
- Unusual API activity
- Security events (GuardDuty findings)
- System errors and performance degradation
- Data access anomalies

### 5. Logs available for SIEM ingestion?
**Yes.** Logs can be exported in multiple formats:
- **CloudWatch Logs:** Stream to SIEM via Kinesis
- **S3 Export:** JSON, CSV formats
- **API Access:** Programmatic log retrieval
- **Formats:** JSON, Syslog, CEF

---

## Data Destruction

### 1. Data retention period?
- **Active Data:** Retained while account is active
- **Backup Data:** 30-day rolling backups
- **Audit Logs:** 7 years for compliance
- **Deleted Data:** 30-day soft delete, then permanent deletion

### 2. Secure data destruction methods?
- **Database:** Cryptographic erasure (delete encryption keys)
- **Backups:** Secure deletion with verification
- **Storage:** AWS S3 secure deletion
- **Physical Media:** AWS certified destruction (when hardware decommissioned)

### 3. Certificate of data destruction?
**Yes.** Upon request, we provide:
- Data destruction confirmation
- Timestamp of deletion
- Scope of data destroyed
- Verification of backup removal

### 4. Data identification for removal?
**Yes.** Customer data is:
- Logically isolated by organization ID
- Tagged for identification
- Exportable before deletion
- Retention: 30 days after contract termination (configurable)

---

## Encryption

### 1. Data encrypted at rest?
**Yes.**
- **Algorithm:** AES-256
- **Implementation:** AWS KMS for key management
- **Scope:** Database (MongoDB), file storage (S3), backups

### 2. Data encrypted in transit?
**Yes.**
- **Protocol:** TLS 1.2 and TLS 1.3
- **Scope:** All API communications, database connections, third-party integrations
- **Certificates:** AWS Certificate Manager (automatic renewal)

### 3. Data encrypted in use?
**Partial.** Application memory is not encrypted, but:
- Sensitive data minimized in memory
- Secure coding practices to prevent data leakage
- Memory cleared after processing sensitive operations

### 4. Secure protocols enforced?
**Yes.**
- HTTPS enforced (HTTP redirects to HTTPS)
- SFTP for file transfers
- WSS (WebSocket Secure) for real-time communications
- TLS 1.2+ required (TLS 1.0/1.1 disabled)

### 5. Integrity checks on encrypted data?
**Yes.**
- Checksums for file uploads
- Database integrity constraints
- Backup verification
- TLS provides integrity via HMAC

---

## Performance & Metrics

### 1. Performance metrics gathered?
- Response times (p50, p95, p99)
- Throughput (requests per minute)
- Error rates
- Database query performance
- API endpoint usage
- User engagement metrics
- AI agent performance (token usage, response times)

Customer-specific metrics available via dashboard and API.

### 2. Load balancing?
**Yes.**
- AWS Application Load Balancer
- Auto-scaling based on CPU/memory utilization
- Health checks every 30 seconds
- Automatic failover to healthy instances

### 3. Customer visibility to metrics?
- Real-time dashboard in application
- API endpoints for programmatic access
- Custom reports available
- Performance SLA monitoring

### 4. Known latency issues/bottlenecks?
**No known issues.** Continuous monitoring identifies and resolves bottlenecks proactively:
- Database query optimization
- API response caching
- CDN for static assets
- Regular performance testing

### 5. Past data breaches?
**No.** MockSurvey365 has never experienced a data breach. We maintain:
- Proactive security monitoring
- Regular security assessments
- Incident response readiness
- Cyber insurance coverage

---

## System Availability

### 1. Standard uptime availability?
**Target:** 99.9% uptime (< 8.76 hours downtime/year)  
**Actual:** Consistently exceeds 99.9%  
**Monitoring:** Real-time uptime tracking with public status page

### 2. Data center locations?
**AWS Multi-Region Architecture:**
- Primary: US-East-1 (N. Virginia)
- Backup: US-West-2 (Oregon) for disaster recovery
- Multiple Availability Zones within each region
- Geographic redundancy for data protection

### 3. Disaster recovery plan?
**Yes.**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour
- **Backup Frequency:** Continuous replication + daily snapshots
- **Testing:** Quarterly DR drills
- **Failover:** Automated failover to secondary region

### 4. Single-point-of-failure analysis?
**Yes.** Completed annually:
- Multi-AZ database deployment (no single point of failure)
- Load-balanced application servers
- Redundant network paths
- Multiple DNS servers
- Automated failover mechanisms

---

## Artificial Intelligence (AI, LLM)

### 1. AI models used?
**OpenAI GPT-4 family:**
- GPT-4o for complex analysis
- GPT-4o-mini for faster operations
- GPT-4-turbo for specialized tasks

### 2. Data used to train AI?
**We do NOT train AI models.** We use OpenAI's pre-trained models via API. Training data is OpenAI's responsibility (publicly available internet data up to their knowledge cutoff).

### 3. Customer data used for training?
**No.** Customer data is NEVER used for AI model training:
- OpenAI API configured with zero data retention
- No opt-in to OpenAI training programs
- Data sent to OpenAI is not stored or used for model improvement
- Contractual agreement with OpenAI prohibits training on our data

### 4. Is data anonymized/de-identified?
**Yes.** When sending data to AI:
- Resident names can be anonymized (configurable)
- Medical record numbers removed or tokenized
- Minimal PHI sent (only necessary for analysis)
- De-identification options available per customer preference

### 5. AI access to live/realtime data?
**Limited access:**
- AI processes data only when explicitly invoked by user actions
- No continuous AI monitoring of customer data
- AI accesses only data necessary for specific requests
- No external data sources accessed by AI

### 6. Safeguards against AI exposing sensitive data?
**Yes:**
- Input filtering removes excessive PHI before AI processing
- Output validation checks for sensitive data leakage
- Prompt engineering to prevent sensitive data in responses
- Rate limiting to prevent data extraction attacks
- Audit logging of all AI interactions

### 7. AI content audited for decision-making?
**Yes:**
- AI-generated content is marked as "AI-assisted"
- Human review required for critical decisions (citations, compliance)
- Audit trail of AI-generated content
- User can edit/override AI suggestions

### 8. AI content evaluated to mitigate hallucination?
**Yes:**
- RAG (Retrieval-Augmented Generation) grounds AI in actual documents
- Source citations provided for AI responses
- Confidence scores displayed
- Validation against reference documents (F-tags, pathways)
- User feedback mechanism to report inaccuracies

### 9. AI reasoning accessible?
**Partial:**
- Source documents used for RAG are shown
- Matching scores and relevance displayed
- Prompt engineering is proprietary
- Explanation of AI decision-making available in documentation

### 10. AI decision-making process explanation?
**Simplified:**
1. User asks question or requests analysis
2. System retrieves relevant documents (F-tags, Critical Element pathways, resident data)
3. AI analyzes retrieved content in context of question
4. AI generates response based on retrieved facts
5. System validates response and provides source citations
6. User reviews and can accept/modify AI suggestions

### 11. Data ownership?
**Customer owns all data:**
- Input data: Customer retains full ownership
- AI-generated output: Customer owns all generated content
- Derivatives: Customer owns any modified or derived data
- No transfer of ownership to MockSurvey365 or OpenAI

### 12. Restrictions on AI output use?
**No restrictions.** Customers can:
- Use AI output for any lawful purpose
- Modify and distribute AI-generated content
- Incorporate into their own documents and reports
- Share with third parties as needed

**Note:** Customers are responsible for reviewing AI output for accuracy before use in official compliance documents.

### 13. Data security/privacy controls in AI?
- **Encryption:** All data encrypted in transit to OpenAI (TLS 1.2+)
- **Access Control:** Only authorized users can invoke AI features
- **Audit Logging:** All AI requests logged with user ID and timestamp
- **Data Minimization:** Only necessary data sent to AI
- **No Training:** Data not used for model training (OpenAI API agreement)
- **Isolation:** Customer data isolated, no cross-customer data sharing

### 14. Prevent AI misuse?
**Yes:**
- Rate limiting prevents abuse
- Input validation blocks malicious prompts
- Output filtering prevents harmful content generation
- Audit logging detects misuse patterns
- Terms of Service prohibit malicious use

### 15. AI output copyrighted material?
**Unlikely but possible:**
- OpenAI's models trained on internet data (may include copyrighted material)
- AI generates new content, not direct copies
- Customers should review output for potential copyright issues
- MockSurvey365 not liable for copyright violations in AI output (per ToS)

### 16. AI hosting location?
**OpenAI Cloud (Azure):**
- OpenAI API hosted on Microsoft Azure
- Geographic location: United States
- HIPAA-compliant infrastructure (BAA with OpenAI)
- No on-premises AI deployment

### 17. Protection against unauthorized access/tampering?
- **API Keys:** Secure storage in AWS Secrets Manager
- **Access Control:** IAM roles restrict API key access
- **Encryption:** Keys encrypted at rest and in transit
- **Rotation:** Regular API key rotation
- **Monitoring:** Unusual API usage triggers alerts

### 18. AI systems tested for adversarial attacks?
**Yes:**
- Prompt injection testing (attempts to manipulate AI behavior)
- Data extraction testing (attempts to extract training data)
- Jailbreak testing (attempts to bypass safety controls)
- Regular security assessments of AI integration
- Input validation prevents malicious prompts

### 19. Past AI-related incidents?
**No.** No incidents involving AI that impacted data security, privacy, or customer trust. We maintain:
- Proactive monitoring of AI usage
- Regular security assessments
- Incident response plan for AI-related issues

---

## Data Elements Definition

**PHI/PII Data Elements Processed:**

### Protected Health Information (PHI):
- **Resident Names:** Full names of nursing home residents
- **Medical Record Numbers:** Facility-assigned identifiers
- **Diagnoses:** Medical conditions (pressure ulcers, falls, dementia, etc.)
- **Medications:** Antipsychotics, antianxiety, pain medications
- **Clinical Data:** MDS assessment data, care plans, treatment notes
- **Health Status:** ADL scores, cognitive status, behavioral symptoms
- **Provider Information:** Physician names, nurse names

### Personally Identifiable Information (PII):
- **User Names:** Healthcare professionals using the system
- **Email Addresses:** User account emails
- **Organization Names:** Facility names, corporate entities
- **IP Addresses:** Logged for security purposes
- **User Activity:** Audit logs of user actions

### Data Handling:
- All PHI/PII encrypted at rest (AES-256) and in transit (TLS 1.2+)
- Access restricted by role-based permissions
- Audit logging of all PHI/PII access
- HIPAA compliance maintained
- Data retention policies enforced
- Secure deletion procedures

---

## Summary

MockSurvey365 is a secure, HIPAA-compliant SaaS platform for CMS healthcare survey preparation. We leverage enterprise-grade AWS infrastructure with comprehensive security controls, regular audits, and proactive monitoring. Our AI-powered features enhance efficiency while maintaining strict data privacy and security standards.

**Key Security Highlights:**
- ✅ HIPAA Compliant with BAAs in place
- ✅ SOC 2 Type II (infrastructure), application audit planned 2025
- ✅ 99.9%+ uptime with disaster recovery
- ✅ Encryption at rest (AES-256) and in transit (TLS 1.2+)
- ✅ MFA enforced for administrative access
- ✅ Regular penetration testing and vulnerability assessments
- ✅ 24/7 monitoring and incident response
- ✅ AI safeguards prevent data exposure and hallucination
- ✅ Customer data never used for AI training

**Contact Information:**
For additional security documentation, compliance reports, or technical questions, please contact our security team.

---

*Document Version 1.0 - January 5, 2025*
