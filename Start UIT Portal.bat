@echo off
setlocal
title UIT Student Portal launcher
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required but was not found.
  where winget >nul 2>nul
  if errorlevel 1 (
    echo Install it from https://nodejs.org ^(LTS^), then double-click this file again.
    pause
    exit /b 1
  )
  choice /m "Install Node.js LTS now with winget"
  if errorlevel 2 exit /b 1
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo.
  echo Node.js was installed. Close this window and double-click the launcher again so it can find node.
  pause
  exit /b 0
)

node tools\launch.mjs %*
if errorlevel 1 (
  echo.
  echo The portal stopped with an error - see the messages above.
  pause
)
