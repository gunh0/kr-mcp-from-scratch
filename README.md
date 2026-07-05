# MCP 야호~

> 제목의 "야호~"는 리센느(RESCENE)의 ["거제 야호" 밈](https://namu.wiki/w/%EA%B1%B0%EC%A0%9C%20%EC%95%BC%ED%98%B8)에서 따왔습니다.

## 무엇을 다루나요?

MCP(Model Context Protocol)를 처음부터 직접 만들어보며 배우는 학습자료입니다. "MCP가 대체 뭐고, 왜 필요하고, 어떻게 만드는가"를 개념 → 실전 순서로 전달하는 것이 목표입니다.

- **MCP 개념 잡기** — 핵심 개념(Tool·Resource·Prompt)과 대표 예시 서버, MCP가 푸는 N×M 문제.
- **프로토콜 vs 서버** — HTTP↔웹 서버 비유로 "MCP 서버"의 실체를 이해하고, JSON-RPC 메시지 규격과 두 가지 전송 방식(stdio / Streamable HTTP)을 비교합니다.
- **Confluence를 MCP 서버처럼 활용하기** — 문서 저장소를 MCP Tool로 노출하면 일반 API 연동과 무엇이 다른지 비교합니다.
- **RAG와 MCP의 차이** — 자주 혼동되는 둘이 각각 어떤 문제를 푸는지, 언제 무엇을 쓰면 좋은지 정리합니다.
- **`.claude`로 프로젝트 컨텍스트 관리하기** — 프로젝트 레벨 `.claude` + `CLAUDE.md`를 레포에 커밋해 팀 전체가 같은 컨텍스트를 공유하는 전략. `.claude`는 "항상 알고 있어야 할 규칙", RAG는 "필요할 때 찾아보는 지식", MCP는 "직접 쓸 수 있는 도구" — 셋은 경쟁이 아니라 조합해서 쓰는 레이어입니다.
- **Python + Docker로 로컬 MCP 서버 만들기** — 공식 [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)로 서버를 직접 구현하고, Docker로 누구나 재현 가능하게 패키징합니다.
- **학습 로드맵** — 개념 정리 → 서버 만들기 → 망분리 환경 이식 → Tool 설계 고도화, 이어서 컨텍스트/하네스 엔지니어링과 평가·보안까지 가는 심층 트랙.

최종 목표는 인터넷과 분리된 프라이빗 네트워크(망분리) 환경에서 동작하는 MCP 구성입니다. 외부 SaaS 없이도 보안 점검·자료 정리·보고서 초안 작성 같은 반복 업무를 로컬 MCP Tool 조합으로 지원하는 시나리오를 예제로 사용합니다.

## 학습자료 웹사이트 (`web/`)

위 내용을 7단계 레벨의 게이미피케이션 슬라이드(장표 단위 스크롤 스냅, XP바, 순차 언락 애니메이션, 3D 틸트 카드)로 정리한 정적 사이트입니다. `web/index.html` 하나에 모든 장표가 담겨 있고, `nginx` 기반 Docker 이미지로 어디서든 배포할 수 있습니다.

### 로컬 실행

```bash
# docker compose로 실행 (프로젝트 루트에서)
docker compose up -d --build
# http://localhost:3333 접속

# 또는 web/ 디렉터리를 단독 이미지로 빌드/배포
cd web
docker build -t mcp-ya-ho-lecture:latest .
docker run -d -p 3333:80 --name mcp-ya-ho-lecture mcp-ya-ho-lecture:latest
```

또는 Makefile 사용:

```bash
make run     # 컨테이너 없이 web/ 폴더를 로컬 서버로 바로 실행 (http://localhost:3333)
make up      # docker compose로 백그라운드 기동
make down    # 컨테이너 중지
make deploy  # origin 브랜치 기준 강제 동기화 후 컨테이너 재배포 (배포 서버용)
```

### 슬라이드 PDF로 내보내기

`make pdf`를 실행하면 Playwright(headless Chromium, Docker)로 각 섹션(슬라이드)을 PNG로 캡처한 뒤 한 권의 PDF로 취합합니다. 로컬에 Node/Playwright를 설치할 필요 없이 Docker만 있으면 됩니다.

```bash
make pdf
# dist/slides/00-hero.png ... 07-s-roadmap.png (슬라이드별 PNG)
# dist/mcp-ya-ho-lecture.pdf (취합된 PDF)
```

`web/` 폴더(Dockerfile, nginx.conf, index.html, script.js)만 복사하면 다른 서버·클러스터에도 동일하게 배포할 수 있습니다.
