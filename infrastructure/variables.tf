variable "project_name" {
  description = "Project name"
  type        = string
  default     = "courserate-sg"
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1" # Singapore
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "domain_name" {
  description = "Domain name for the application (will be used for both frontend and backend)"
  type        = string
}

variable "github_repo_url" {
  description = "GitHub repository URL for Amplify"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
}

variable "backend_container_image" {
  description = "Container image for the backend API"
  type        = string
}

variable "backend_container_port" {
  description = "Port on which the backend API listens"
  type        = number
  default     = 80
}

variable "db_name" {
  description = "Name of the RDS database"
  type        = string
  default     = "courseratesg"
}

variable "db_username" {
  description = "Master username for the RDS database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Master password for the RDS database"
  type        = string
  sensitive   = true
}
