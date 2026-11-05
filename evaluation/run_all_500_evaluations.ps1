param(
  [ValidateSet('offline', 'react', 'bootstrap')]
  [string]$Stage = 'offline',
  [string]$Model = 'gemini-3.1-flash-lite',
  [int]$BatchSize = 5,
  [int]$PacingMs = 5000,
  [double]$EvidenceOverlap = 0.7,
  [double]$TaskOverlap = 0.25
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

function Invoke-Step([string]$Label, [string]$Command) {
  Write-Host "`n=== $Label ===" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE."
  }
}

switch ($Stage) {
  'offline' {
    Invoke-Step 'Heuristic 500 evaluation' 'npx tsx evaluation/run_ami_pilot.ts'
    Invoke-Step 'Hybrid 500 evaluation' 'npx tsx evaluation/run_ami_hybrid.ts'
    Invoke-Step 'Bootstrap analysis' 'npx tsx evaluation/analyze_pilot_results.ts'
  }
  'react' {
    $env:GEMINI_BATCH_MODEL = $Model
    $env:GEMINI_BATCH_WORKFLOW = 'react'
    $env:GEMINI_BATCH_POSTPROCESS = 'guardrails'
    $env:GEMINI_BATCH_SIZE = [string]$BatchSize
    $env:GEMINI_BATCH_PACING_MS = [string]$PacingMs
    $env:GEMINI_EVIDENCE_OVERLAP = [string]$EvidenceOverlap
    $env:GEMINI_TASK_OVERLAP = [string]$TaskOverlap
    $env:GEMINI_BATCH_MAX_ATTEMPTS = '3'
    $env:GEMINI_BATCH_CHECKPOINT = '../research_data/ami_pilot_gemini_react_batch_checkpoint.json'
    $env:GEMINI_BATCH_OUTPUT = '../research_data/ami_pilot_gemini_react_guardrails_batch_500_results.json'
    $env:GEMINI_BATCH_ERROR = '../research_data/ami_pilot_gemini_react_guardrails_batch_last_error.json'
    Invoke-Step 'Gemini ReAct 500 evaluation' 'npx tsx evaluation/run_ami_gemini_batch.ts'
    Invoke-Step 'Bootstrap analysis' 'npx tsx evaluation/analyze_pilot_results.ts'
  }
  'bootstrap' {
    Invoke-Step 'Bootstrap analysis' 'npx tsx evaluation/analyze_pilot_results.ts'
  }
}

Write-Host "`nCompleted stage: $Stage" -ForegroundColor Green
