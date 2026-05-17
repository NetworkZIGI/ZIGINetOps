# ZIGINetOps 설치/개발 환경 구축 가이드 (GitHub + AWS EC2)

이 문서는 현재 저장소 코드를 기준으로, 새로운 환경(특히 AWS EC2)에서 동일하게 개발을 이어가기 위한 설치/설정 절차를 정리합니다.

## 1) 사전 준비

- GitHub 저장소 준비 (현재 코드를 push 가능한 상태)
- AWS 계정 및 EC2 생성 권한
- (선택) Route53/도메인
- AWS Bedrock 사용 예정이면:
  - Bedrock 모델 접근 권한 활성화
  - EC2에 Bedrock 호출 가능한 IAM Role 부여 권장

---

## 2) 로컬 코드 GitHub 업로드

저장소 루트에서:

```bash
git status
git add .
git commit -m "chore: prepare deployment/install documentation and app setup"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin <YOUR_BRANCH>
```

이미 remote가 있으면 `git remote add`는 생략합니다.

---

## 3) EC2 인스턴스 생성

권장 사양(개발용):

- OS: Ubuntu 22.04 LTS 이상
- 타입: t3.medium 이상 권장
- 스토리지: 20GB+

보안 그룹(개발 기준):

- SSH: `22` (본인 IP만 허용 권장)
- Frontend dev: `5173` (필요 시)
- Backend API: `8000` (필요 시)

운영 배포 시에는 80/443 + 리버스 프록시(Nginx) 방식 권장.

---

## 4) EC2 기본 패키지 설치

EC2 접속 후:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential pkg-config libpcap-dev python3 python3-venv python3-pip
```

`scapy` 패킷 처리에 `libpcap-dev`가 필요할 수 있습니다.

---

## 5) Node.js 설치 (중요)

이 프로젝트의 Vite 버전은 **Node.js 20.19+ 또는 22.12+**가 필요합니다.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Node 버전이 20.19 미만이면 프론트 dev 서버가 실패할 수 있습니다.

---

## 6) 코드 클론

```bash
cd ~
git clone <YOUR_GITHUB_REPO_URL>
cd ZIGINetOps
```

---

## 7) 백엔드 설치/설정

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
cp .env.example .env
```

`.env` 주요 항목:

- `APP_ENV=local` : 로컬 echo LLM 사용 (AWS 자격증명 없어도 UI 테스트 가능)
- `APP_ENV=prod` : Bedrock 실제 호출
- `AWS_REGION`, `BEDROCK_MODEL_ID` : Bedrock 연동 필수
- `CORS_ORIGINS`, `CORS_ORIGIN_REGEX` : 접근 도메인/포트에 맞게 수정

Bedrock 실제 사용 시:

- EC2 IAM Role 방식 권장 (액세스 키 하드코딩 금지)
- 필요한 권한 예: `bedrock:InvokeModel`

---

## 8) 프론트엔드 설치/설정

```bash
cd ~/ZIGINetOps/frontend
npm install
```

현재 `vite.config.ts`는 dev 서버에서 `/api` 요청을 `http://127.0.0.1:8000`으로 프록시합니다.

필요 시 `VITE_API_BASE_URL` 환경변수로 API 주소를 오버라이드할 수 있습니다.

---

## 9) 개발 서버 실행

터미널 1 (백엔드):

```bash
cd ~/ZIGINetOps/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

터미널 2 (프론트):

```bash
cd ~/ZIGINetOps/frontend
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

접속:

- 프론트: `http://<EC2_PUBLIC_IP>:5173`
- 백엔드 헬스체크: `http://<EC2_PUBLIC_IP>:8000/api/health`

---

## 10) 테스트/검증

백엔드 테스트:

```bash
cd ~/ZIGINetOps
./backend/.venv/bin/python -m pytest backend/tests
./backend/.venv/bin/python -m ruff check backend/app backend/tests
```

프론트 빌드:

```bash
cd ~/ZIGINetOps/frontend
npm run build
```

---

## 11) 데이터/파일 저장 경로

백엔드 기준:

- 업로드된 pcap 파일: `backend/app/storage/pcap_file`
- CSV 메타데이터: `backend/app/storage/csv`

영속 저장이 필요하면 EBS 스냅샷/백업 전략을 함께 운영하세요.

---

## 12) 운영 전환 시 권장

- Nginx + systemd + HTTPS(ACM/Certbot) 구성
- `uvicorn` 단독 대신 `gunicorn + uvicorn workers` 검토
- EC2 보안 그룹 최소 권한 원칙
- CloudWatch 로그 수집/모니터링
- `.env`/시크릿은 AWS SSM Parameter Store 또는 Secrets Manager 사용 권장

---

## 13) 자주 발생하는 이슈

1. 프론트 실행 실패 (Vite/rolldown 에러)
   - Node 버전 확인 (`node -v`)
   - 20.19+로 업그레이드

2. 업로드 실패/422
   - 브라우저 devtools network에서 `/api/packet/files` 요청 확인
   - 프론트 dev proxy 및 백엔드 포트(8000) 확인

3. Bedrock 호출 실패
   - EC2 IAM Role 권한 확인
   - `AWS_REGION`, `BEDROCK_MODEL_ID` 확인
   - `APP_ENV=prod` 여부 확인

