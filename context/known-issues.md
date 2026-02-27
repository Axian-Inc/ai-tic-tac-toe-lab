# Known Issues
Date: 2026-02-05

- 2026-02-09: Terraform apply for TTT-11 failed due to missing IAM permission `cloudfront:CreateOriginAccessControl` for the current AWS user.
- 2026-02-16: Terraform execution for TTT-11 failed in shell with `No valid credential sources found`; resolved on 2026-02-16 after AWS credentials were configured and apply/validation succeeded.
