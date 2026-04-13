@echo off
REM Depuis la racine du depot (dossier qui contient backend/ et frontend/)
cd /d "%~dp0.."

echo [1/4] npm install + build frontend...
cd frontend
call npm install
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
cd ..

echo [2/4] git add...
git add -A
git status

echo [3/4] git commit...
git commit -m "fix: GraphQL token+normalisation, REST pagination, filtres, deps tests, UI fleuve, doc Vercel"
if errorlevel 1 (
  echo Rien a committer ou erreur commit.
)

echo [4/4] pull rebase + push...
git pull --rebase origin main
if errorlevel 1 exit /b 1
git push origin main
if errorlevel 1 exit /b 1

echo Termine.
exit /b 0
