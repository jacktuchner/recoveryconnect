@echo off
cd /d C:\Users\jackt\recoveryconnect
rmdir /s /q src\generated\prisma 2>nul
call npx prisma generate
call npm run dev
