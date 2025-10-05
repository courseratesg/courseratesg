resource "aws_security_group" "sg_rds" {
  tags = {
    Name = "${var.project_name}-sg-rds"
  }

  vpc_id = aws_vpc.vpc_main.id

  description = "Security group for RDS PostgreSQL"
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ecs" {
  security_group_id = aws_security_group.sg_rds.id

  description                  = "PostgreSQL from ECS (IPv4 and IPv6)"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.sg_ecs.id
}

resource "aws_vpc_security_group_egress_rule" "rds_egress_all_ipv4" {
  security_group_id = aws_security_group.sg_rds.id

  description = "Allow all outbound IPv4"
  ip_protocol = -1
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "rds_egress_all_ipv6" {
  security_group_id = aws_security_group.sg_rds.id

  description = "Allow all outbound IPv6"
  ip_protocol = -1
  cidr_ipv6   = "::/0"
}

resource "aws_db_subnet_group" "main" {
  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }

  name        = "${var.project_name}-db-subnet-group"
  description = "Subnet group for RDS PostgreSQL"

  subnet_ids = [
    for subnet in aws_subnet.subnet_private : subnet.id
  ]
}

resource "aws_db_instance" "main" {
  tags = {
    Name = "${var.project_name}-rds"
  }

  identifier = "${var.project_name}-rds"

  engine                = "postgres"
  engine_version        = "17.6"
  instance_class        = "db.t4g.micro"
  allocated_storage     = 20
  storage_type          = "gp3"
  storage_encrypted     = true
  max_allocated_storage = 100

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.sg_rds.id]

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "20:00-21:00"
  maintenance_window      = "sun:21:00-sun:22:00"

  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade",
  ]

  auto_minor_version_upgrade   = true
  deletion_protection          = false
  skip_final_snapshot          = false
  final_snapshot_identifier    = "${var.db_name}-rds-final-snapshot"
  copy_tags_to_snapshot        = true
  performance_insights_enabled = true

  parameter_group_name = aws_db_parameter_group.main.name
}

resource "aws_db_parameter_group" "main" {
  tags = {
    Name = "${var.project_name}-db-parameter-group"
  }

  name        = "${var.project_name}-db-parameter-group"
  family      = "postgres17"
  description = "Custom parameter group for PostgreSQL 17"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }
}
