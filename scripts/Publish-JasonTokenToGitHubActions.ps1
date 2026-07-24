param(
  [string]$Repository = "dillonmohr8777/jason-fallon-hubspot-agent",
  [string]$SecretName = "JASON_HUBSPOT_PRIVATE_APP_TOKEN"
)

$ErrorActionPreference = "Stop"

if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI is required."
}

& gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$candidatePaths = @(
  (Join-Path $repoRoot ".secrets\jason-hubspot-token.dpapi"),
  (Join-Path $env:LOCALAPPDATA "Codex\Secrets\jason-hubspot-token.dpapi"),
  "C:\Users\dillo\Documents\Codex\2026-07-12\hubspot-agent-set-jasonhubspottoken-ps1-hubspot\hubspot-agent\.secrets\jason-hubspot-token.dpapi"
)

$secretPath = $candidatePaths | Where-Object {
  Test-Path -LiteralPath $_
} | Select-Object -First 1

if (!$secretPath) {
  throw "No protected Jason/Momentum DPAPI credential was found."
}

$encrypted = Get-Content -LiteralPath $secretPath -Raw
$secure = ConvertTo-SecureString $encrypted
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$process = $null

try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if (!$plain) {
    throw "The protected credential was empty."
  }

  $ghPath = (Get-Command gh).Source
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $ghPath
  $startInfo.Arguments = "secret set $SecretName --repo $Repository --app actions"
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  if (!$process.Start()) {
    throw "Unable to start GitHub CLI."
  }

  $process.StandardInput.Write($plain)
  $process.StandardInput.Close()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    throw "GitHub rejected the secret update. The raw credential was not printed."
  }
} finally {
  $plain = $null
  if ($process) {
    $process.Dispose()
  }
  if ($pointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

$matchingSecret = & gh secret list --repo $Repository --app actions --json name,updatedAt |
  ConvertFrom-Json |
  Where-Object { $_.name -eq $SecretName }

if (!$matchingSecret) {
  throw "GitHub did not confirm the expected Actions secret metadata."
}

[pscustomobject]@{
  repository = $Repository
  secretName = $SecretName
  updatedAt = $matchingSecret.updatedAt
  rawValueExposed = $false
  consumer = "GitHub Actions workflow: Jason HubSpot Live Audit"
} | ConvertTo-Json
