resource "aws_security_group" "sg_ecs" {
  tags = {
    Name = "${var.project_name}-sg-ecs"
  }

  vpc_id = aws_vpc.vpc_main.id

  description = "Security group for ECS tasks"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id = aws_security_group.sg_ecs.id

  description                  = "HTTP from ALB (IPv4 and IPv6)"
  ip_protocol                  = "tcp"
  from_port                    = var.backend_container_port
  to_port                      = var.backend_container_port
  referenced_security_group_id = aws_security_group.sg_alb.id
}

resource "aws_vpc_security_group_egress_rule" "ecs_egress_all_ipv4" {
  security_group_id = aws_security_group.sg_ecs.id

  description = "Allow all outbound IPv4"
  ip_protocol = -1
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "ecs_egress_all_ipv6" {
  security_group_id = aws_security_group.sg_ecs.id

  description = "Allow all outbound IPv6"
  ip_protocol = -1
  cidr_ipv6   = "::/0"
}

resource "aws_ecs_cluster" "main" {
  tags = {
    Name = "${var.project_name}-ecs-cluster"
  }

  name = "${var.project_name}-ecs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }

  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-task-execution-secrets-policy"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }

  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "ecs" {
  tags = {
    Name = "${var.project_name}-ecs-logs"
  }

  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
}

locals {
  ecs_task_cpu      = 256
  ecs_task_memory   = 512
  ecs_desired_count = 1
}

resource "aws_ecs_task_definition" "main" {
  tags = {
    Name = "${var.project_name}-ecs-task"
  }

  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.ecs_task_cpu
  memory                   = local.ecs_task_memory

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.backend_container_image
      cpu       = local.ecs_task_cpu
      memory    = local.ecs_task_memory
      essential = true

      portMappings = [
        {
          containerPort = var.backend_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = tostring(var.backend_container_port)
        },
        {
          name  = "COGNITO_USER_POOL_ID"
          value = aws_cognito_user_pool.main.id
        },
        {
          name  = "COGNITO_CLIENT_ID"
          value = aws_cognito_user_pool_client.main.id
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
      ]

      secrets = [
        {
          name      = "DB_HOST"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:host::"
        },
        {
          name      = "DB_PORT"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:port::"
        },
        {
          name      = "DB_NAME"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:dbname::"
        },
        {
          name      = "DB_USERNAME"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:${var.backend_container_port}/health || exit 1",
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])
}

resource "aws_ecs_service" "main" {
  tags = {
    Name = "${var.project_name}-ecs-service"
  }

  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = local.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [
      for subnet in aws_subnet.subnet_public : subnet.id
    ]
    security_groups  = [aws_security_group.sg_ecs.id]
    assign_public_ip = true # Required for internet access without NAT gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "backend"
    container_port   = var.backend_container_port
  }

  health_check_grace_period_seconds = 60

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  enable_execute_command = true

  # Ignore changes to task_definition since it's managed by CI/CD pipeline
  lifecycle {
    ignore_changes = [task_definition]
  }
}
