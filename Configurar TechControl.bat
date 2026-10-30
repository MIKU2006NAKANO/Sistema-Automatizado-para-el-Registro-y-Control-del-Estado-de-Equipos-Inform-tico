@echo off
setlocal
cd /d "%~dp0"
title TechControl ITERN - Configuracion inicial
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"
if errorlevel 1 (
  echo Se requiere Node.js 24 o superior.
  pause
  exit /b 1
)
echo La configuracion inicial descarga dependencias y requiere Internet.
where pnpm >nul 2>nul
if errorlevel 1 (
  call npm install
) else (
  call pnpm install --frozen-lockfile
)
if errorlevel 1 goto fallo
call npm run build
if errorlevel 1 goto fallo
echo Configuracion terminada. Ya puedes desconectar Internet.
echo Abre Iniciar TechControl.bat para utilizar el sistema.
pause
exit /b 0
:fallo
echo No se completo la configuracion. Revisa el error anterior.
pause
exit /b 1
