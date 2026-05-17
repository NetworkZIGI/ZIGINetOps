# ZIGINetOps

Network operator AIOps portal for pcap upload, IP obfuscation, packet summary analysis, tcpdump analysis, and Bedrock-backed chat.

## Stack

- Backend: FastAPI, Python 3.11+, scapy, boto3 Bedrock Runtime
- Frontend: React, TypeScript, Vite, TanStack Query, Zustand
- State: CSV repositories under `backend/app/storage/csv`
- Files: pcap uploads under `backend/app/storage/pcap_file`

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```

`APP_ENV=local` uses a local echo LLM client for development. Set `APP_ENV=prod`, AWS credentials, `AWS_REGION`, and `BEDROCK_MODEL_ID` to use AWS Bedrock through `boto3`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000/api`. Override it with `VITE_API_BASE_URL`.

## Tests

```bash
cd backend
pytest

cd ../frontend
npm run build
```

## Documentation

- Architecture: `docs/architecture.md`
- API contract: `docs/api-contract.md`
