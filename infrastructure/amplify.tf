resource "aws_iam_role" "amplify" {
  tags = {
    Name = "${var.project_name}-amplify-role"
  }

  name = "${var.project_name}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "amplify" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmplifyBackendDeployFullAccess"
}

locals {
  amplify_environment_variables = {
    VITE_USE_MOCK_API            = "false"
    VITE_API_BASE_URL            = "https://api.${var.domain_name}"
    VITE_AWS_REGION              = var.aws_region
    VITE_AWS_USER_POOL_ID        = aws_cognito_user_pool.main.id
    VITE_AWS_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
  }
}

resource "aws_amplify_app" "main" {
  tags = {
    Name = "${var.project_name}-amplify"
  }

  name                 = "${var.project_name}-app"
  repository           = var.github_repo_url
  access_token         = var.github_token
  iam_service_role_arn = aws_iam_role.amplify.arn

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/build
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
  EOT

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  environment_variables = local.amplify_environment_variables

  enable_branch_auto_build    = true
  enable_auto_branch_creation = false
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = "main"

  enable_auto_build = true

  framework = "React"
  stage     = "PRODUCTION"

  environment_variables = local.amplify_environment_variables
}

resource "aws_amplify_domain_association" "main" {
  app_id      = aws_amplify_app.main.id
  domain_name = var.domain_name

  certificate_settings {
    type                   = "CUSTOM"
    custom_certificate_arn = aws_acm_certificate.www.arn
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }
}
