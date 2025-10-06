resource "aws_security_group" "sg_alb" {
  tags = {
    Name = "${var.project_name}-sg-alb"
  }

  vpc_id = aws_vpc.vpc_main.id

  description = "Security group for Application Load Balancer"
}

resource "aws_vpc_security_group_ingress_rule" "alb_http_ipv4" {
  security_group_id = aws_security_group.sg_alb.id

  description = "HTTP from anywhere (IPv4)"
  ip_protocol = "tcp"
  from_port   = 80
  to_port     = 80
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_http_ipv6" {
  security_group_id = aws_security_group.sg_alb.id

  description = "HTTP from anywhere (IPv6)"
  ip_protocol = "tcp"
  from_port   = 80
  to_port     = 80
  cidr_ipv6   = "::/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https_ipv4" {
  security_group_id = aws_security_group.sg_alb.id

  description = "HTTPS from anywhere (IPv4)"
  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https_ipv6" {
  security_group_id = aws_security_group.sg_alb.id

  description = "HTTPS from anywhere (IPv6)"
  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
  cidr_ipv6   = "::/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ecs" {
  security_group_id = aws_security_group.sg_alb.id

  description                  = "To ECS (IPv4 and IPv6)"
  ip_protocol                  = "tcp"
  from_port                    = var.backend_container_port
  to_port                      = var.backend_container_port
  referenced_security_group_id = aws_security_group.sg_ecs.id
}

resource "aws_lb" "main" {
  tags = {
    Name = "${var.project_name}-alb"
  }

  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.sg_alb.id]

  subnets = [
    for subnet in aws_subnet.subnet_public : subnet.id
  ]

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  ip_address_type = "dualstack"
}

resource "aws_lb_target_group" "main" {
  tags = {
    Name = "${var.project_name}-tg"
  }

  name        = "${var.project_name}-tg"
  port        = var.backend_container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc_main.id
  target_type = "ip"

  ip_address_type = "ipv4"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  deregistration_delay = 30

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
