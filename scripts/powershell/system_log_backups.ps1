###############################################################################
# Name:        system_log_backups.ps1
# Description: This script backs up the Windows Security audit log files
#              to a specified location.
# Author:      Christopher White
###############################################################################
param (
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]$BackupLocation
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SourcePath = "C:\Windows\System32\winevt\Logs"
$DestinationPath = Join-Path -Path $BackupLocation -ChildPath "SystemLogs_$Timestamp.zip"
Compress-Archive -Path $SourcePath -DestinationPath $DestinationPath
Write-Host "System logs backed up to: $DestinationPath"