###############################################################################
# Name:        audit_log_backups.ps1
# Description: This script backs up the Windows Security audit log files
#              to a specified location.
# Author:      Christopher White
###############################################################################
param (
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]$BackupLocation
)

# Create a timestamp for the backup file
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Set the backup file name
$BackupFileName = "SecurityLogs_$Timestamp.evtx"

# Set the source and destination paths
$SourcePath = "C:\Windows\System32\winevt\Logs\Security.evtx"
$DestinationPath = Join-Path -Path $BackupLocation -ChildPath $BackupFileName

# Copy the audit log file to the backup location
Copy-Item -Path $SourcePath -Destination $DestinationPath -Force

# Output the success message
Write-Host "Audit logs backed up to: $DestinationPath"