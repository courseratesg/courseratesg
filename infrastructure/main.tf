terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket = "${var.project_name}-terraform-states"
    key    = "${var.project_name}.tfstate"
    region = var.aws_region
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Origin  = "terraform"
      Project = var.project_name
    }
  }
}
