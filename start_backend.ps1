Set-Location -Path "$PSScriptRoot\backend"
python -m pip install -r requirements.txt
python -m uvicorn api.app:app --reload --host 127.0.0.1 --port 8000
