resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  tags = {
    Name = "${var.project_name}-alb-target-response-time"
  }

  alarm_name          = "${var.project_name}-alb-target-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ALB target response time"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_host_count" {
  tags = {
    Name = "${var.project_name}-alb-unhealthy-host-count"
  }

  alarm_name          = "${var.project_name}-alb-unhealthy-host-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "This metric monitors unhealthy hosts"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_utilization" {
  tags = {
    Name = "${var.project_name}-ecs-cpu-utilization"
  }

  alarm_name          = "${var.project_name}-ecs-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = aws_ecs_service.main.name
    ClusterName = aws_ecs_cluster.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_utilization" {
  tags = {
    Name = "${var.project_name}-ecs-memory-utilization"
  }

  alarm_name          = "${var.project_name}-ecs-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ServiceName = aws_ecs_service.main.name
    ClusterName = aws_ecs_cluster.main.name
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", {
              stat  = "Sum"
              label = "Total Requests"
            }],
            [".", "TargetResponseTime", {
              stat  = "Average"
              label = "Response Time"
            }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
          yAxis = {
            left = {
              label = "Count/Time"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", {
              stat  = "Average"
              label = "CPU Utilization"
            }],
            [".", "MemoryUtilization", {
              stat  = "Average"
              label = "Memory Utilization"
            }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Metrics"
          yAxis = {
            left = {
              label = "Percent"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", {
              stat  = "Average"
              label = "Database Connections"
            }],
            [".", "CPUUtilization", {
              stat  = "Average"
              label = "CPU Utilization"
            }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
          yAxis = {
            left = {
              label = "Count/Percent"
            }
          }
        }
      },
    ]
  })
}
