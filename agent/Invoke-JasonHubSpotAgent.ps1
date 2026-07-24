param(
  [Parameter(Position = 0)]
  [ValidateSet("context", "check-token", "verify-ready", "snapshot", "schema-audit", "attribution-audit")]
  [string]$Command = "verify-ready",

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = "Stop"

$agentRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $agentRoot
$agentScript = Join-Path $agentRoot "jason-hubspot-agent.mjs"
$projectSecret = Join-Path $repoRoot ".secrets\jason-hubspot-token.dpapi"
$localSecret = Join-Path $env:LOCALAPPDATA "Codex\Secrets\jason-hubspot-token.dpapi"
$legacySecret = "C:\Users\dillo\Documents\Codex\2026-07-12\hubspot-agent-set-jasonhubspottoken-ps1-hubspot\hubspot-agent\.secrets\jason-hubspot-token.dpapi"
$canonicalEnv = "JASON_HUBSPOT_PRIVATE_APP_TOKEN"

function Get-ExistingJasonToken {
  foreach ($name in @(
    "JASON_HUBSPOT_PRIVATE_APP_TOKEN",
    "JASON_HUBSPOT_SERVICE_KEY",
    "JASON_HUBSPOT_ACCESS_TOKEN"
  )) {
    $item = Get-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue
    if ($item -and $item.Value) {
      return [pscustomobject]@{ Token = $item.Value; Source = "environment:$name" }
    }
  }
  return $null
}

function Read-DpapiToken {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (!(Test-Path -LiteralPath $Path)) {
    return $null
  }

  $encrypted = Get-Content -LiteralPath $Path -Raw
  $secure = ConvertTo-SecureString $encrypted
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    if ($pointer -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
  }
}

function Resolve-JasonToken {
  $existing = Get-ExistingJasonToken
  if ($existing) {
    return $existing
  }

  foreach ($candidate in @($projectSecret, $localSecret, $legacySecret)) {
    $token = Read-DpapiToken -Path $candidate
    if ($token) {
      return [pscustomobject]@{ Token = $token; Source = "dpapi:$candidate" }
    }
  }

  throw "No Jason/Momentum HubSpot credential was found. Run .\agent\Set-JasonHubSpotToken.ps1. Generic HubSpot variables are intentionally ignored to prevent Align/Jason account crossover."
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 18 or newer is required."
}

$nodeMajor = [int]((& node --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 18) {
  throw "Node.js 18 or newer is required. Found $(& node --version)."
}

if ($Command -eq "context") {
  & node $agentScript $Command @Rest
  exit $LASTEXITCODE
}

$resolved = Resolve-JasonToken
$priorCanonical = Get-Item -LiteralPath "Env:$canonicalEnv" -ErrorAction SilentlyContinue
$env:JASON_HUBSPOT_PRIVATE_APP_TOKEN = $resolved.Token
$env:JASON_HUBSPOT_CREDENTIAL_SOURCE = $resolved.Source

try {
  & node $agentScript $Command @Rest
  if ($LASTEXITCODE -ne 0) {
    throw "Jason HubSpot agent command '$Command' failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item -LiteralPath "Env:JASON_HUBSPOT_CREDENTIAL_SOURCE" -ErrorAction SilentlyContinue
  if ($priorCanonical) {
    $env:JASON_HUBSPOT_PRIVATE_APP_TOKEN = $priorCanonical.Value
  } else {
    Remove-Item -LiteralPath "Env:JASON_HUBSPOT_PRIVATE_APP_TOKEN" -ErrorAction SilentlyContinue
  }
}
