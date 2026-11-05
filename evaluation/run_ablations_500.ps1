param(
  [ValidateSet('no-evidence', 'no-uncertainty', 'no-safety')]
  [string]$Ablation,
  [string]$Model = 'gemini-3.1-flash-lite',
  [int]$BatchSize = 5,
  [int]$PacingMs = 5000
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..
$prefix = "ami_pilot_gemini_$Ablation"
$env:GEMINI_BATCH_MODEL = $Model
$env:GEMINI_BATCH_WORKFLOW = 'baseline'
$env:GEMINI_BATCH_ABLATION = $Ablation
$env:GEMINI_BATCH_SIZE = [string]$BatchSize
$env:GEMINI_BATCH_PACING_MS = [string]$PacingMs
$env:GEMINI_BATCH_MAX_ATTEMPTS = '3'
$env:GEMINI_BATCH_CHECKPOINT = "../research_data/${prefix}_checkpoint.json"
$env:GEMINI_BATCH_OUTPUT = "../research_data/${prefix}_500_results.json"
$env:GEMINI_BATCH_ERROR = "../research_data/${prefix}_last_error.json"

Write-Host "Running ablation: $Ablation" -ForegroundColor Cyan
npx tsx evaluation/run_ami_gemini_batch.ts
if ($LASTEXITCODE -ne 0) { throw "Ablation failed with exit code $LASTEXITCODE." }
npx tsx evaluation/analyze_pilot_results.ts
