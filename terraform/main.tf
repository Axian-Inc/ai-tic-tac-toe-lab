provider "aws" {
  region = var.aws_region
}

data "aws_region" "current" {}
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

locals {
  allowed_workspace = "stanb"
}

resource "terraform_data" "workspace_guard" {
  input = terraform.workspace

  lifecycle {
    precondition {
      condition     = terraform.workspace == local.allowed_workspace
      error_message = "This configuration must be run from the 'stanb' workspace. The default workspace is not allowed."
    }
  }
}

resource "aws_s3_bucket" "site" {
  bucket = var.bucket_name
  tags   = var.tags

  depends_on = [terraform_data.workspace_guard]
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "site_public_read" {
  statement {
    sid    = "PublicReadGetObject"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.site.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_public_read.json

  depends_on = [aws_s3_bucket_public_access_block.site]
}

data "aws_ami" "server" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_security_group" "server" {
  name        = "tic-tac-toe-server"
  description = "Allow inbound traffic for the multiplayer server."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP game traffic"
    from_port   = var.server_port
    to_port     = var.server_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_iam_role" "server_instance" {
  name = "tic-tac-toe-server-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "server_ssm" {
  role       = aws_iam_role.server_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "server" {
  name = "tic-tac-toe-server-instance"
  role = aws_iam_role.server_instance.name
}

resource "aws_instance" "server" {
  ami                    = data.aws_ami.server.id
  instance_type          = var.server_instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.server.id]
  iam_instance_profile   = aws_iam_instance_profile.server.name
  tags                   = var.tags

  user_data = <<-USER_DATA
              #!/usr/bin/env bash
              set -euo pipefail

              dnf install -y curl awscli
              curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
              dnf install -y nodejs

              mkdir -p /opt/ai-tic-tac-toe/server

              cat <<'UNIT' > /etc/systemd/system/tic-tac-toe-server.service
              [Unit]
              Description=AI Tic Tac Toe Multiplayer Server
              After=network.target

              [Service]
              WorkingDirectory=/opt/ai-tic-tac-toe
              Environment=PORT=${var.server_port}
              ExecStart=/usr/bin/node /opt/ai-tic-tac-toe/server/index.js
              Restart=always
              RestartSec=2
              ConditionPathExists=/opt/ai-tic-tac-toe/server/index.js

              [Install]
              WantedBy=multi-user.target
              UNIT

              systemctl daemon-reload
              systemctl enable tic-tac-toe-server
              USER_DATA

  depends_on = [terraform_data.workspace_guard]
}
