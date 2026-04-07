param(
    [ValidateSet('schema', 'clean', 'seed', 'all')]
    [string]$Mode = 'all'
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Resolve-Path (Join-Path $scriptRoot '..\..')
$envFile = Join-Path $backendRoot '.env'
$schemaScript = Join-Path $scriptRoot '01_create_schema.js'
$cleanScript = Join-Path $scriptRoot '02_clean_database.js'
$seedScript = Join-Path $scriptRoot '03_seed_dummy_data.js'

function Get-MongoshCommand {
    $command = Get-Command mongosh -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $fallback = 'C:\Users\Mandini\AppData\Local\Programs\mongosh\mongosh.exe'
    if (Test-Path $fallback) {
        return $fallback
    }

    throw 'mongosh was not found on PATH and the fallback install path does not exist.'
}

function Get-MongoUri {
    if ($env:MONGODB_URI) {
        return $env:MONGODB_URI
    }

    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match '^MONGODB_URI=' } | Select-Object -First 1
        if ($line) {
            return $line -replace '^MONGODB_URI=', ''
        }
    }

    throw 'MONGODB_URI was not found in the environment or backend\\.env.'
}

$mongosh = Get-MongoshCommand
$mongoUri = Get-MongoUri

function Invoke-MongoScript {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "MongoDB script not found: $Path"
    }

    & $mongosh $mongoUri $Path
}

switch ($Mode) {
    'schema' { Invoke-MongoScript $schemaScript }
    'clean'  { Invoke-MongoScript $cleanScript }
    'seed'   { Invoke-MongoScript $seedScript }
    'all' {
        Invoke-MongoScript $cleanScript
        Invoke-MongoScript $schemaScript
        Invoke-MongoScript $seedScript
    }
}
