@echo off
REM AgentFlow Windows 启动脚本
REM 用法: start-agentflow.bat [port]
REM 先复制 .env.example 为 .env 并填入 API Key

setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" if not "%%~A"=="" (
            if not "%%A"=="#" set "%%A=%%B"
        )
    )
)

if "%AGENT_MODEL%"=="" set "AGENT_MODEL=deepseek-v4-flash"
if "%1"=="" (set "PORT=9600") else (set "PORT=%1")

echo === AgentFlow ===
echo Model: %AGENT_MODEL%
echo Port: %PORT%
echo WorkDir: %SCRIPT_DIR%

python -u "%SCRIPT_DIR%agentflow-backend.py" %PORT%
