resource "aws_acm_certificate" "www" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  # Amplify requires the certificate to be in us-east-1.
  region = "us-east-1"
  subject_alternative_names = [
    "*.${var.domain_name}"
  ]
}

resource "aws_acm_certificate" "api" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"
}
