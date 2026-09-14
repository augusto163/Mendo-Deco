@echo off
title MendoDeco - Sincronizar con GitHub
echo ========================================================
echo        Sincronizando MendoDeco con GitHub
echo        Repositorio: https://github.com/augusto163/Mendo-Deco
echo ========================================================
echo.
echo Conectando con GitHub y subiendo tus archivos...
echo Si se abre una pestana en tu navegador, haz clic en 'Sign in with your browser' / 'Authorize'.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo    TODO EL PROYECTO SE SUBIO EXITOSAMENTE A GITHUB!
    echo ========================================================
) else (
    echo.
    echo Si el repositorio remoto tenia archivos previos, intentaremos sincronizar:
    git pull origin main --rebase
    git push -u origin main
)
echo.
pause
