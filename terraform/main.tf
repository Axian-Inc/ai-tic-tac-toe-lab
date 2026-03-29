locals {
  name_prefix = "${var.resource_namespace}-${var.project_name}-${var.environment}"
  frontend_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Namespace   = var.resource_namespace
      Service     = "frontend"
    },
    var.tags,
  )
  backend_tags = merge(
    local.frontend_tags,
    {
      Service = "backend"
    },
  )
}

module "frontend_delivery" {
  source = "./modules/frontend_delivery"

  name_prefix            = local.name_prefix
  bucket_force_destroy   = var.frontend_bucket_force_destroy
  price_class            = var.price_class
  domain_aliases         = var.domain_aliases
  acm_certificate_arn    = var.acm_certificate_arn
  route53_zone_id        = var.route53_zone_id
  create_route53_records = var.create_route53_records
  tags                   = local.frontend_tags
}

module "multiplayer_backend" {
  source = "./modules/multiplayer_backend"

  name_prefix            = local.name_prefix
  aws_region             = var.aws_region
  frontend_base_url      = "https://${module.frontend_delivery.frontend_distribution_domain_name}"
  lambda_package_path    = abspath("${path.root}/../../../backend")
  lambda_memory_size     = var.backend_lambda_memory_size
  lambda_timeout_seconds = var.backend_lambda_timeout_seconds
  tags                   = local.backend_tags
}
