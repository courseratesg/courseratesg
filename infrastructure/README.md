# Infrastructure

This directory contains Terraform / OpenTofu configuration for deploying the
CourseRate SG platform on AWS.
The infrastructure is designed as a cloud-based SaaS platform for university
students in Singapore to evaluate courses and professors.

## Architecture

The platform uses AWS managed services to ensure scalability, security, and ease
of maintenance.
All components are deployed in the AWS Singapore region (ap-southeast-1).

### Request Flow

1. Users access the React frontend served by AWS Amplify
2. Users authenticate via AWS Cognito and receive JWT tokens
3. Frontend makes API calls directly to the Application Load Balancer with JWT
   in Authorization headers
4. ALB forwards requests to ECS Fargate containers running the FastAPI backend
5. Backend validates JWT tokens and queries the RDS PostgreSQL database
6. Responses are returned through the same path back to the frontend

### Network Architecture

The infrastructure uses a VPC with dual-stack IPv4/IPv6 networking across
multiple availability zones.

- VPC CIDR: 10.0.0.0/16 with auto-assigned IPv6 CIDR
- Public subnets: Host the Application Load Balancer
- Private subnets: Host ECS Fargate tasks and RDS database instances
- Internet Gateway: Provides public internet access for public subnets
- Route tables: Separate routing for public and private subnets

## Components

### Frontend (`amplify.tf`)

AWS Amplify Hosting serves the React single-page application with integrated
CDN, automatic CI/CD from GitHub, and SSL/TLS termination.

- Automatic deployments from the main branch
- Built-in CloudFront CDN for global content delivery
- Environment variables injected for Cognito configuration
- Default AWS-provided domain used for simplicity

### Authentication (`cognito.tf`)

AWS Cognito User Pool manages user authentication with email verification and
JWT token issuance.

- Email-based authentication with verification
- Self-service password recovery
- JWT tokens for API authorization
- User pool client configured for the frontend application
- Anonymous reviews ensured by storing only Cognito user_id with reviews

### Backend API (`ecs.tf`, `alb.tf`)

Amazon ECS Fargate runs containerized FastAPI backend instances in private
subnets.
The Application Load Balancer in public subnets provides the API endpoint.

- ECS cluster with Fargate launch type for serverless container execution
- Task definition specifies container image, CPU, memory, and environment
  variables
- ECS service manages task scaling and load balancer integration
- Application Load Balancer distributes traffic across tasks
- Target group performs health checks on the /health endpoint
- Security groups restrict access to necessary ports only

### Database (`rds.tf`, `secrets.tf`)

Amazon RDS PostgreSQL with Multi-AZ deployment runs in private subnets,
accessible only to ECS containers.

- PostgreSQL engine with Multi-AZ for high availability
- Database credentials stored in AWS Secrets Manager
- Automated backups with configurable retention
- Encryption at rest and in transit
- Database subnet group spans multiple availability zones
- Security groups limit access to backend containers only

### Backup (`backup.tf`)

AWS Backup performs automated daily snapshots of the RDS database.

- Daily backup schedule at 03:00 UTC
- 30-day retention for point-in-time recovery
- Backup vault with lifecycle policies
- IAM role for backup service

### Monitoring (`cloudwatch.tf.disabled`)

AWS CloudWatch configuration is available but currently disabled.
When enabled, it provides monitoring for ALB and ECS metrics.

### Security (`waf.tf.disabled`)

AWS WAF configuration is available but currently disabled.
When enabled, it protects the ALB with SQL injection and XSS prevention rules.

## Deployment

### Prerequisites

1. Install Terraform or OpenTofu
2. Configure AWS credentials with appropriate permissions
3. Prepare a GitHub personal access token for Amplify
4. Build and push the backend container image to a registry

### Configuration

Create or update `terraform.tfvars` with required variables:

```hcl
domain_name = "your-domain.com"

github_repo_url = "https://github.com/your-org/your-repo"
github_token    = "your-github-token"

backend_container_image = "your-registry/backend:tag"

db_password = "your-secure-database-password"
```

Optional variables with defaults:

- `project_name`: Default "courserate-sg"
- `aws_region`: Default "ap-southeast-1"
- `az_count`: Default 2
- `backend_container_port`: Default 80
- `db_name`: Default "courseratesg"
- `db_username`: Default "postgres"

### Deployment Steps

1. Initialize OpenTofu (replace with `terraform` if using Terraform):

   ```sh
   tofu init
   ```

2. Review the execution plan:

   ```sh
   tofu plan
   ```

3. Apply the configuration:

   ```sh
   tofu apply
   ```

4. Note the outputs for application configuration:

   ```sh
   tofu output
   ```

Key outputs include:

- `cognito_user_pool_id`: For frontend authentication configuration
- `cognito_user_pool_client_id`: For frontend authentication configuration
- `alb_dns_name`: Backend API endpoint
- `amplify_default_domain`: Frontend URL
- `rds_endpoint`: Database connection endpoint

### Post-Deployment

1. Configure frontend environment variables in Amplify console or via OpenTofu
2. Trigger initial Amplify deployment if not automatic
3. Run database migrations against the RDS instance
4. Verify health endpoints for backend services
5. Test authentication flow and API connectivity

### Updates

To update the infrastructure:

1. Modify infrastructure definitions as needed
2. Run `tofu plan` to review changes
3. Run `tofu apply` to apply changes

For backend application updates, push a new container image and update the ECS service to force a new deployment.

### Cleanup

To destroy all infrastructure:

```sh
tofu destroy
```

Note: This will permanently delete all resources including the database.
Ensure backups are preserved if needed.

## File Organization

- `main.tf`: Provider configuration and backend state setup
- `variables.tf`: Input variable definitions
- `terraform.tfvars`: Variable values (not committed to version control)
- `outputs.tf`: Output definitions for important resource attributes
- `network.tf`: VPC, subnets, route tables, and internet gateway
- `cognito.tf`: User pool and authentication configuration
- `amplify.tf`: Frontend hosting and CI/CD
- `alb.tf`: Application load balancer and target groups
- `ecs.tf`: Container orchestration and task definitions
- `rds.tf`: PostgreSQL database configuration
- `secrets.tf`: Secrets Manager for database credentials
- `backup.tf`: Backup vault and plans
- `acm.tf`: Certificate configuration (if custom domain used)
- `cloudwatch.tf.disabled`: Monitoring configuration (optional)
- `waf.tf.disabled`: Web application firewall (optional)

## Design Principles

- Use AWS managed services to minimize operational overhead
- Follow Terraform / OpenTofu best practices for resource organization
- Avoid lifecycle directives; resolve dependencies through proper resource relationships
- Use separate security group rules instead of inline rules
- Enable dual-stack IPv4/IPv6 networking
- Hardcode stable values like CIDR blocks rather than over-abstracting
- Default to AWS-provided domains to avoid certificate management complexity
