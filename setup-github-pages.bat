@echo off
chcp 65001 >nul
echo.
echo 🎲 Configurando Trivial para GitHub Pages...
echo.

:: Verificar que estamos en el directorio correcto
if not exist "index.html" (
    echo ❌ Error: Ejecuta este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

echo ✅ Directorio del proyecto verificado

:: Verificar si Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Git no está instalado. Instálalo desde https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git está instalado

:: Verificar si ya es un repositorio Git
if exist ".git" (
    echo ⚠️  Ya existe un repositorio Git. Continuando...
) else (
    echo 🔄 Inicializando repositorio Git...
    git init
    git branch -M main
    echo ✅ Repositorio Git inicializado
)

:: Agregar archivos
echo 🔄 Agregando archivos al repositorio...
git add .

:: Hacer commit
echo 🔄 Haciendo commit...
git commit -m "Initial commit: Trivial game ready for GitHub Pages" >nul 2>&1

echo.
echo 🌐 INSTRUCCIONES PARA GITHUB PAGES:
echo ==================================
echo.
echo 1. 📁 Crear repositorio en GitHub:
echo    - Ve a https://github.com/new
echo    - Nombre: trivial-game
echo    - Público (para GitHub Pages gratuito)
echo    - NO inicialices con README
echo.
echo 2. 🔗 Conectar repositorio:
echo    git remote add origin https://github.com/TU-USUARIO/trivial-game.git
echo    git push -u origin main
echo.
echo 3. ⚙️ Activar GitHub Pages:
echo    - Repositorio → Settings → Pages
echo    - Source: "GitHub Actions"
echo.
echo 4. 🚀 Tu juego estará en:
echo    https://TU-USUARIO.github.io/trivial-game
echo.
echo ✅ Configuración completa!
echo.
pause
