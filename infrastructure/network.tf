resource "aws_vpc" "vpc_main" {
  tags = {
    Name = "${var.project_name}-vpc"
  }

  cidr_block                       = "10.0.0.0/16"
  assign_generated_ipv6_cidr_block = true

  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "igw_main" {
  tags = {
    Name = "${var.project_name}-igw"
  }

  vpc_id = aws_vpc.vpc_main.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = {
    for i, az in data.aws_availability_zones.available.names :
    i => az if i < var.az_count
  }
}

resource "aws_subnet" "subnet_public" {
  for_each = local.azs

  tags = {
    Name = "${var.project_name}-subnet-public-${each.value}"
  }

  vpc_id            = aws_vpc.vpc_main.id
  availability_zone = each.value

  cidr_block              = cidrsubnet(aws_vpc.vpc_main.cidr_block, 8, each.key)
  map_public_ip_on_launch = true

  ipv6_cidr_block                 = cidrsubnet(aws_vpc.vpc_main.ipv6_cidr_block, 8, each.key)
  assign_ipv6_address_on_creation = true
}

resource "aws_subnet" "subnet_private" {
  for_each = local.azs

  tags = {
    Name = "${var.project_name}-subnet-private-${each.value}"
  }

  vpc_id            = aws_vpc.vpc_main.id
  availability_zone = each.value

  cidr_block = cidrsubnet(
    aws_vpc.vpc_main.cidr_block,
    8,
    var.az_count + each.key
  )

  ipv6_cidr_block = cidrsubnet(
    aws_vpc.vpc_main.ipv6_cidr_block,
    8,
    var.az_count + each.key
  )
  assign_ipv6_address_on_creation = true
}

resource "aws_route_table" "rtb_public" {
  tags = {
    Name = "${var.project_name}-rtb-public"
  }

  vpc_id = aws_vpc.vpc_main.id

  route {
    cidr_block = aws_vpc.vpc_main.cidr_block
    gateway_id = "local"
  }
  route {
    ipv6_cidr_block = aws_vpc.vpc_main.ipv6_cidr_block
    gateway_id      = "local"
  }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_main.id
  }
  route {
    ipv6_cidr_block = "::/0"
    gateway_id      = aws_internet_gateway.igw_main.id
  }
}

resource "aws_route_table_association" "rta_public" {
  for_each = local.azs

  subnet_id      = aws_subnet.subnet_public[each.key].id
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table" "rtb_private" {
  for_each = local.azs

  tags = {
    Name = "${var.project_name}-rtb-private-${each.value}"
  }

  vpc_id = aws_vpc.vpc_main.id

  route {
    cidr_block = aws_vpc.vpc_main.cidr_block
    gateway_id = "local"
  }
  route {
    ipv6_cidr_block = aws_vpc.vpc_main.ipv6_cidr_block
    gateway_id      = "local"
  }
}

resource "aws_route_table_association" "rta_private" {
  for_each = local.azs

  subnet_id      = aws_subnet.subnet_private[each.key].id
  route_table_id = aws_route_table.rtb_private[each.key].id
}
