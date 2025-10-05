resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  region            = var.aws_region
}

# Amplify requires the certificate to be in us-east-1.
resource "aws_acm_certificate" "main_amplify" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  region            = "us-east-1"
}
