param(
  [string]$Destination
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (!$Destination) {
  $Destination = Join-Path $repoRoot ".secrets\jason-hubspot-token.dpapi"
}

$secretDirectory = Split-Path -Parent $Destination
if (!(Test-Path -LiteralPath $secretDirectory)) {
  New-Item -ItemType Directory -Path $secretDirectory | Out-Null
}

$secure = Read-Host "Enter the Jason/Momentum HubSpot private-app token for portal 50612503" -AsSecureString
if (!$secure) {
  throw "No token was entered."
}

$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if (!$plain) {
    throw "No token was entered."
  }

  $prior = Get-Item -LiteralPath "Env:JASON_HUBSPOT_PRIVATE_APP_TOKEN" -ErrorAction SilentlyContinue
  $env:JASON_HUBSPOT_PRIVATE_APP_TOKEN = $plain
  try {
    & node (Join-Path $PSScriptRoot "jason-hubspot-agent.mjs") check-token
    if ($LASTEXITCODE -ne 0) {
      throw "Token validation failed. Nothing was stored."
    }
  } finally {
    if ($prior) {
      $env:JASON_HUBSPOT_PRIVATE_APP_TOKEN = $prior.Value
    } else {
      Remove-Item -LiteralPath "Env:JASON_HUBSPOT_PRIVATE_APP_TOKEN" -ErrorAction SilentlyContinue
    }
  }

  $encrypted = ConvertFrom-SecureString $secure
  Set-Content -LiteralPath $Destination -Value $encrypted -Encoding UTF8 -NoNewline
} finally {
  if ($pointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

Write-Output (@{
  stored = $true
  portalId = "50612503"
  path = $Destination
  protection = "Windows DPAPI, current user"
} | ConvertTo-Json)
