# CourseRate SG

CourseRate SG is a cloud-native Software-as-a-Service (SaaS) platform for
university students in Singapore to evaluate and access insights about courses
and professors.
The platform addresses the common problem students face during course
registration: the lack of reliable, organized information to make informed
decisions.

## Overview

University students in Singapore often struggle to find reliable information
about courses and professors during registration periods.
Existing platforms like RateMyProfessors focus primarily on North American
universities, while local solutions like NanyangMods suffer from outdated course
lists that must be manually maintained by administrators.
CourseRate SG solves these problems through several key features:

- Dual search functionality by course code or professor name
- Student-driven course database that updates organically as students submit
  reviews
- Structured ratings (overall experience, difficulty, workload) that take
  seconds to provide
- Professor tracking across universities to maintain review history even when
  faculty move
- Anonymous reviews achieved by storing only Cognito user IDs, not personal
  information

## Architecture

The platform leverages AWS managed services to ensure scalability, security, and
ease of maintenance, deployed in the AWS Singapore region (ap-southeast-1).

Key components include:

- Front-end: React single-page application served by AWS Amplify with integrated
  CDN and automatic CI/CD from GitHub
- Authentication: AWS Cognito User Pool manages authentication with email
  verification and JWT token issuance
- Back-end API: FastAPI application running on Amazon ECS Fargate in private
  subnets, accessed via Application Load Balancer
- Database: Amazon RDS PostgreSQL with Multi-AZ deployment for high availability
- Security: AWS Secrets Manager for database credentials, HTTPS for all traffic,
  network isolation via VPC
- Infrastructure: Entire stack defined using Terraform with automated
  deployments via GitHub Actions

## Repository Structure

```plaintext
.
├── .github/workflows/    GitHub Actions CI/CD workflows
│
├── backend/              Back-end FastAPI application
│   ├── alembic/          Database migration scripts
│   ├── app/              Application code
│   │   ├── api/          API endpoints and routing
│   │   ├── infrastructure/ External service clients (RDS)
│   │   ├── models/       SQLAlchemy database models
│   │   ├── schemas/      Pydantic validation schemas
│   │   ├── settings/     Configuration management
│   │   └── storage/      Data access layer
│   ├── scripts/          Utility scripts (database seeding, startup)
│   ├── Dockerfile        Container image definition
│   ├── docker-compose.yml Local development environment
│   └── requirements.txt  Python dependencies
│
├── frontend/             Front-end React application
│   ├── src/              Source code
│   │   ├── components/   React components and pages
│   │   ├── services/     API client and authentication
│   │   ├── styles/       Global styles
│   │   └── types/        TypeScript type definitions
│   ├── build/            Production build output
│   └── package.json      Node.js dependencies
│
└── infrastructure/       Terraform infrastructure as code
    ├── main.tf           Provider and back-end configuration
    ├── variables.tf      Input variable definitions
    ├── outputs.tf        Output definitions
    ├── network.tf        VPC, subnets, routing
    ├── cognito.tf        Authentication configuration
    ├── amplify.tf        Front-end hosting
    ├── alb.tf            Application load balancer
    ├── ecs.tf            Container orchestration
    ├── rds.tf            PostgreSQL database
    ├── secrets.tf        Secrets Manager
    └── backup.tf         Backup configuration
```

## Technology Stack

Back-end:

- FastAPI: Modern async web framework with automatic OpenAPI documentation
- PostgreSQL: Relational database with advanced indexing for complex queries
- SQLAlchemy 2.0: ORM with async support
- Pydantic v2: Data validation and serialization
- Alembic: Database migration management
- Docker: Containerization for consistent deployment

Front-end:

- React: Component-based UI library
- TypeScript: Type-safe JavaScript
- Vite: Fast build tool and development server
- AWS Amplify Libraries: Authentication integration

Infrastructure:

- Terraform / OpenTofu: Infrastructure as code
- AWS: Cloud provider (Amplify, Cognito, ECS, RDS, ALB, VPC, Secrets Manager)
- GitHub Actions: CI/CD automation

## Getting Started

You may refer to the steps in the respective `README.md` files in the `backend`,
`frontend`, and `infrastructure` directories for detailed setup and deployment
instructions.

## Deployment

The platform uses automated CI/CD workflows:

- Front-end: AWS Amplify automatically deploys from the main branch via GitHub
  integration
- Back-end: GitHub Actions builds Docker images and deploys to ECS on merges to
  main
- Infrastructure: GitHub Actions validates Terraform changes on pull requests

Manual deployment steps are documented in each component's `README.md` file.
