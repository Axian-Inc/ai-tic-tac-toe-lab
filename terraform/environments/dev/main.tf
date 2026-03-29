check "required_workspace" {
  assert {
    condition     = terraform.workspace == "jlt"
    error_message = "Use the named Terraform workspace 'jlt'. The default workspace is not allowed for this stack."
  }
}

module "stack" {
  source = "../.."

  resource_namespace             = var.resource_namespace
  project_name                   = var.project_name
  environment                    = var.environment
  aws_region                     = var.aws_region
  frontend_bucket_force_destroy  = true
  price_class                    = var.price_class
  domain_aliases                 = var.domain_aliases
  acm_certificate_arn            = var.acm_certificate_arn
  route53_zone_id                = var.route53_zone_id
  create_route53_records         = var.create_route53_records
  backend_lambda_memory_size     = var.backend_lambda_memory_size
  backend_lambda_timeout_seconds = var.backend_lambda_timeout_seconds
  tags                           = var.tags
}
