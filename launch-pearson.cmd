@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" "%SCRIPT_DIR%tools\pearson-launcher.js"
) else (
  node "%SCRIPT_DIR%tools\pearson-launcher.js"
)
pause
