@echo off
setlocal
cd /d "%~dp0"
title TechControl ITERN - Servidor local
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 o superior durante la configuracion inicial.
  pause
  exit /b 1
)
echo Iniciando TechControl ITERN sin Internet...
echo Manten esta ventana abierta mientras utilizas el sistema.
node --env-file-if-exists=.env.local scripts/start.mjs
if errorlevel 1 pause
