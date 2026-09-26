$ErrorActionPreference = 'Stop'
$python = (Get-Command pythonw.exe).Source
$capture = Join-Path $PSScriptRoot 'capture.py'
$startup = [Environment]::GetFolderPath('Startup')
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $startup 'Higgsfield Codex Capture.lnk'))
$shortcut.TargetPath = $python
$shortcut.Arguments = '"' + $capture + '"'
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle = 7
$shortcut.Save()
Start-Process -FilePath $python -ArgumentList ('"' + $capture + '"') -WindowStyle Hidden
Write-Output 'Installed per-user startup shortcut and started Codex capture watcher.'
