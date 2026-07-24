param(
  [switch]$SkipTokenPrompt
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
  if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Install Node.js 18 or newer, then rerun this script."
  }

  if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Warning "GitHub CLI is not installed. The checked-out files still work, but future private-repo pulls need an authenticated Git client."
  }

  & npm test
  if ($LASTEXITCODE -ne 0) {
    throw "Agent tests failed."
  }

  if (!$SkipTokenPrompt) {
    & (Join-Path $repoRoot "agent\Set-JasonHubSpotToken.ps1")
  }

  & (Join-Path $repoRoot "agent\Invoke-JasonHubSpotAgent.ps1") verify-ready
  if ($LASTEXITCODE -ne 0) {
    throw "Live readiness verification failed."
  }

  Write-Output "Claude computer setup complete. Open this repository root in Claude Code; CLAUDE.md and the project skill are ready."
} finally {
  Pop-Location
}
