# Known Issues
Date: 2026-02-05

- 2026-02-09: Terraform apply for TTT-11 failed due to missing IAM permission `cloudfront:CreateOriginAccessControl` for the current AWS user.
- 2026-02-16: Terraform execution for TTT-11 failed in shell with `No valid credential sources found`; resolved on 2026-02-16 after AWS credentials were configured and apply/validation succeeded.
- 2026-03-17: Jira bug `TTT-79` tracks a gameplay-start display defect. Playwright against the deployed CloudFront app confirmed that selecting `X` and clicking `Play vs CPU` had entered the in-game state (`Round 1`, `player-mark = X`, `cpu-mark = O`, 9 board buttons present), but the board layout collapsed visually: the grid measured `24x24` and the first board button measured `0x0`, leaving the board effectively invisible/unusable. The fix has since been implemented in `src/App.tsx`, deployed, and revalidated on CloudFront with a visible `512x512` board and visible square cells. Keep the ticket open until QA closes it.
