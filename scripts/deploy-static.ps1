param(
    [string]$AwsProfile,
    [string]$TerraformDir = "infra/terraform",
    [string]$BuildDir = "dist",
    [string[]]$BuildCommand = @("npm", "run", "build"),
    [string]$BucketName,
    [string]$DistributionId,
    [string]$CloudFrontUrl,
    [switch]$SkipBuild,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-CommandAvailable {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command -Name $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found on PATH: $Name"
    }
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter()][string[]]$Arguments = @()
    )

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Executable $($Arguments -join ' ')"
    }
}

function Get-TerraformOutput {
    param(
        [Parameter(Mandatory = $true)][string]$Dir,
        [Parameter(Mandatory = $true)][string]$OutputName
    )

    $value = & terraform -chdir="$Dir" output -raw "$OutputName"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to read terraform output '$OutputName' from '$Dir'."
    }
    return $value.Trim()
}

Test-CommandAvailable -Name "aws"

if (-not $SkipBuild) {
    if (-not (Test-Path "package.json")) {
        throw "package.json not found. Add app sources first or run with -SkipBuild and provide an existing -BuildDir."
    }

    if ($BuildCommand.Count -eq 0) {
        throw "BuildCommand cannot be empty."
    }

    $buildExecutable = $BuildCommand[0]
    $buildArgs = @()
    if ($BuildCommand.Count -gt 1) {
        $buildArgs = $BuildCommand[1..($BuildCommand.Count - 1)]
    }

    Write-Host "Running build command: $($BuildCommand -join ' ')"
    Invoke-CheckedCommand -Executable $buildExecutable -Arguments $buildArgs
}
else {
    Write-Host "Skipping build step."
}

if (-not (Test-Path -Path $BuildDir)) {
    throw "Build directory not found: $BuildDir"
}

if ([string]::IsNullOrWhiteSpace($BucketName) -or [string]::IsNullOrWhiteSpace($DistributionId) -or [string]::IsNullOrWhiteSpace($CloudFrontUrl)) {
    Test-CommandAvailable -Name "terraform"
}

if ([string]::IsNullOrWhiteSpace($BucketName)) {
    $BucketName = Get-TerraformOutput -Dir $TerraformDir -OutputName "bucket_name"
}

if ([string]::IsNullOrWhiteSpace($DistributionId)) {
    $DistributionId = Get-TerraformOutput -Dir $TerraformDir -OutputName "cloudfront_distribution_id"
}

if ([string]::IsNullOrWhiteSpace($CloudFrontUrl)) {
    $CloudFrontUrl = Get-TerraformOutput -Dir $TerraformDir -OutputName "cloudfront_url"
}

$awsProfileArgs = @()
if (-not [string]::IsNullOrWhiteSpace($AwsProfile)) {
    $awsProfileArgs = @("--profile", $AwsProfile)
}

$resolvedBuildDir = (Resolve-Path -Path $BuildDir).Path

$syncArgs = @("s3", "sync", $resolvedBuildDir, "s3://$BucketName", "--delete") + $awsProfileArgs
if ($DryRun) {
    $syncArgs += "--dryrun"
}

Write-Host "Syncing deploy artifacts to s3://$BucketName"
Invoke-CheckedCommand -Executable "aws" -Arguments $syncArgs

if ($DryRun) {
    Write-Host "Dry run mode enabled: skipping CloudFront invalidation."
}
else {
    $invalidateArgs = @(
        "cloudfront", "create-invalidation",
        "--distribution-id", $DistributionId,
        "--paths", "/*"
    ) + $awsProfileArgs

    Write-Host "Creating CloudFront invalidation for distribution $DistributionId"
    Invoke-CheckedCommand -Executable "aws" -Arguments $invalidateArgs
}

Write-Host ""
Write-Host "Deploy pipeline completed."
Write-Host "CloudFront URL: $CloudFrontUrl"
Write-Host "Verify deployment:"
Write-Host "  curl -i $CloudFrontUrl"
