resource "aws_secretsmanager_secret" "db_credentials" {
  tags = {
    Name = "${var.project_name}-db-credentials"
  }

  name_prefix             = "${var.project_name}-db-credentials-"
  description             = "Database credentials for RDS PostgreSQL"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.project_name
    engine   = "postgres"
  })
}
