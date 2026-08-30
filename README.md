# ✈️ 제주 플라이트 허브 (Jeju Flight Hub)

제주국제공항(CJU / RKPC)을 중심으로 한반도 전역의 실시간 항공기 운항 현황, Flightradar24 스타일의 항적 추적 레이더, 기종별 좌석배치도 및 한라산 조망 가이드, 제주도민 항공/공항 특화 혜택을 제공하는 올인원 항공 포털 웹 애플리케이션입니다.

---

## 🌟 주요 기능

1. **실시간 출도착 현황판 (FIDS)**
   - 제주공항 출·도착 전 노선 실시간 현황 (정시, 비행중, 탑승중, 지연, 결항)
   - 시간대별(전체/지금 운항중/오전/오후/야간) 및 노선·항공사·상태별 맞춤 필터링
   - 관심 편명(★) 즐겨찾기 보관 (브라우저 로컬 저장)
   - 실시간 비행 진행률, 탑승구(GATE), 수하물 수취대(Carousel), 체크인 카운터 안내

2. **실시간 항공기 레이더 (Live Flight Radar)**
   - Leaflet 기반 관제 항로(Y711, Y722 등) 및 전국 공항 시각화
   - 한반도 상공 실시간 비행 위치(위도/경도, 고도 FL, 속도 kts, 방위각, 승강률) 물리 시뮬레이션
   - 선택 편명 자동 추적(Auto-follow) 및 타겟 포커스
   - 지도 테마 전환 (다크 레이더 / 일반 지도 / 위성 뷰)

3. **기종별 좌석배치도 & 스카이뷰 명당 가이드 (Seat Map Viewer)**
   - 국내선 주요 기종 (B737-800/MAX, A321neo, A330-300 광동체) 인터랙티브 좌석 배치
   - 비상구/1열 레그룸, 빠른 하차 전방석, 리클라인 불가석 등 좌석별 상세 스펙(Pitch, Width, 등받이 각도)
   - 제주 출발/도착 방향에 따른 **한라산 백록담 뷰 / 에메랄드 해변 뷰** 명당 안내

4. **제주도민 특화 허브 (Resident Essentials)**
   - 항공사별 도민할인(10~20%) 사전 등록법 및 직통 링크
   - 제주공항 주차요금 50% 감면 가이드 및 실시간 주차 구역 팁
   - 신분증 없는 손바닥 정맥 바이오패스(Bio-Pass) 3초 탑승 안내
   - 태풍/윈드시어/대설 결항 시 실전 대처 팁 (광동체 대형기 공략, 대체 여객선 등)

---

## 🚀 로컬 실행 방법 (Run Locally)

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
# http://localhost:3000
```

---

## 🌐 Netlify 배포 방법 (Deploy to Netlify)

본 프로젝트는 순수 클라이언트 사이드 SPA로 빌드되며, `netlify.toml` 및 `_redirects` 설정이 완벽히 구성되어 있어 Netlify에서 클릭 한 번으로 배포할 수 있습니다.

### 방법 1: GitHub 연동 자동 배포 (권장)
1. 이 프로젝트 코드를 본인의 **GitHub 저장소**에 Push합니다.
2. [Netlify 대시보드](https://app.netlify.com/)에 로그인 후 **"Add new site" > "Import an existing project"** 클릭.
3. GitHub를 선택하고 해당 저장소를 지정합니다.
4. 빌드 설정은 `netlify.toml`에 의해 자동으로 감지됩니다:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. **"Deploy site"** 버튼을 클릭하면 1분 이내에 글로벌 CDN 배포가 완료됩니다!

### 방법 2: Netlify Drop (빌드 결과물 드래그 앤 드롭)
1. 로컬 터미널에서 `npm run build` 명령을 실행합니다.
2. 생성된 `dist` 폴더를 [Netlify Drop](https://app.netlify.com/drop) 화면에 마우스로 끌어다 놓으면 즉시 배포됩니다.

### 방법 3: Netlify CLI 배포
```bash
# Netlify CLI 설치 (최초 1회)
npm install -g netlify-cli

# 배포 실행
netlify deploy --prod --dir=dist
```

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion)
- **Map & Geo**: Leaflet, CartoDB Dark Matter / ESRI Satellite Tiles
- **Icons**: Lucide React
- **Build Tool**: Vite 6
- **Hosting**: Netlify (Optimized with `netlify.toml`)
