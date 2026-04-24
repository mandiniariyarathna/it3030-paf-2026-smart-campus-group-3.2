# Maven Installation and PATH Setup Script
# Run this script to install Maven and add it to your PATH

Write-Host "=== Maven Setup Script ===" -ForegroundColor Green

# Step 1: Create Maven directory
$mavenHome = "C:\maven"
if (-not (Test-Path $mavenHome)) {
    New-Item -ItemType Directory -Path $mavenHome -Force | Out-Null
    Write-Host "Created Maven directory at: $mavenHome" -ForegroundColor Green
} else {
    Write-Host "Maven directory already exists at: $mavenHome" -ForegroundColor Green
}

# Step 2: Download Maven
Write-Host "`nDownloading Apache Maven 3.9.14..." -ForegroundColor Cyan
    $url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.14/apache-maven-3.9.14-bin.zip"
$zipPath = "$mavenHome\maven.zip"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Write-Host "Downloaded Maven successfully" -ForegroundColor Green
    
    # Step 3: Extract Maven
    Write-Host "Extracting Maven..." -ForegroundColor Cyan
    Expand-Archive -Path $zipPath -DestinationPath $mavenHome -Force
    Remove-Item $zipPath -Force
    
    # Find the extracted directory
    $mavenDir = Get-ChildItem $mavenHome -Directory -Filter "apache-maven-*" | Select-Object -First 1
    Write-Host "Extracted to: $($mavenDir.FullName)" -ForegroundColor Green
    
    # Step 4: Add to PATH permanently (User-level)
    Write-Host "`nAdding Maven to PATH..." -ForegroundColor Cyan
    $mavenBinPath = "$($mavenDir.FullName)\bin"
    
    # Get current PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    
    # Check if already in PATH
    if ($currentPath -like "*$mavenBinPath*") {
        Write-Host "Maven path already in USER PATH" -ForegroundColor Yellow
    } else {
        # Add to PATH
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$mavenBinPath", "User")
        Write-Host "Added Maven bin directory to USER PATH" -ForegroundColor Green
    }
    
    # Set JAVA_HOME if not set
    $javaHome = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
    if (-not $javaHome) {
        [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-23", "User")
        Write-Host "Set JAVA_HOME to: C:\Program Files\Java\jdk-23" -ForegroundColor Green
    }
    
    Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Please restart your PowerShell terminal or VS Code for changes to take effect." -ForegroundColor Yellow
    Write-Host "Then run: mvn --version" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
}
