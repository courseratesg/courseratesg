resource "aws_backup_vault" "main" {
  tags = {
    Name = "${var.project_name}-backup-vault"
  }

  name = "${var.project_name}-backup-vault"
}

resource "aws_backup_plan" "main" {
  tags = {
    Name = "${var.project_name}-backup-plan"
  }

  name = "${var.project_name}-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 21 * * ? *)" # Daily at 9 PM UTC

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Backup = "daily"
    }
  }

  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 21 ? * 7 *)" # Weekly on Sunday at 9 PM UTC

    lifecycle {
      delete_after = 90
    }

    recovery_point_tags = {
      Backup = "weekly"
    }
  }
}

resource "aws_iam_role" "backup" {
  tags = {
    Name = "${var.project_name}-backup-role"
  }

  name = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

resource "aws_backup_selection" "main" {
  name         = "${var.project_name}-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_db_instance.main.arn,
  ]
}
