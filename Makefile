REPO_ROOT   := $(CURDIR)
BRANCH      ?= main
PORT        ?= 3333
DOCKER_CONFIG_DIR := $(REPO_ROOT)/.docker
# 서버의 전역 ~/.docker/config.json 이 깨진 credsStore(wincred 등)를 참조해도
# 영향받지 않도록, credsStore가 없는 격리된 DOCKER_CONFIG를 사용한다.
DOCKER      := DOCKER_CONFIG=$(DOCKER_CONFIG_DIR) docker
COMPOSE     := $(DOCKER) compose

PDF_IMAGE   := mcp-ya-ho-pdf:latest
DIST_DIR    := $(REPO_ROOT)/dist
PDF_OUT     := $(DIST_DIR)/mcp-ya-ho-lecture.pdf

.PHONY: run up down deploy pdf docker-config

## 격리된 docker config 디렉터리 준비 (credsStore 문제 회피, cli-plugins는 유지)
docker-config:
	@mkdir -p $(DOCKER_CONFIG_DIR)/cli-plugins
	@if [ -f $$HOME/.docker/config.json ]; then \
		sed '/"credsStore"/d; /"credHelpers"/d' $$HOME/.docker/config.json > $(DOCKER_CONFIG_DIR)/config.json; \
	else \
		echo '{}' > $(DOCKER_CONFIG_DIR)/config.json; \
	fi
	@if [ -d $$HOME/.docker/cli-plugins ]; then \
		for f in $$HOME/.docker/cli-plugins/*; do \
			if [ -e "$$f" ]; then ln -sf "$$f" $(DOCKER_CONFIG_DIR)/cli-plugins/$$(basename "$$f"); fi; \
		done; \
	fi; true
	@if [ -d $$HOME/.docker/contexts ]; then ln -sfn $$HOME/.docker/contexts $(DOCKER_CONFIG_DIR)/contexts; fi; true

## make run — 컨테이너 없이 web/ 폴더를 로컬 파이썬 서버로 바로 실행
run:
	@echo "▶ 컨테이너 없이 로컬 서버 실행 (http://localhost:$(PORT))..."
	@cd $(REPO_ROOT)/web && python3 -m http.server $(PORT)

## make up — 백그라운드로 빌드 후 실행
up: docker-config
	@echo "▶ 컨테이너 백그라운드 기동..."
	@$(COMPOSE) up -d --build
	@$(COMPOSE) ps
	@echo "▶ http://localhost:$(PORT) 에서 확인하세요"

## make down — 컨테이너 중지 및 제거
down: docker-config
	@echo "▶ 컨테이너 중지..."
	@$(COMPOSE) down

## make deploy — origin 브랜치 기준으로 강제 동기화 후 컨테이너 재배포
deploy: docker-config
	@echo "▶ origin/$(BRANCH) 기준으로 코드 동기화..."
	@git -C $(REPO_ROOT) fetch --all --prune
	@git -C $(REPO_ROOT) checkout -B $(BRANCH) origin/$(BRANCH)
	@git -C $(REPO_ROOT) reset --hard origin/$(BRANCH)
	@echo "▶ 컨테이너 재배포..."
	@$(COMPOSE) up -d --build --remove-orphans
	@$(COMPOSE) ps
	@echo "▶ deploy 완료: http://localhost:$(PORT)"

## make pdf — 각 슬라이드(section)를 PNG로 캡처해 하나의 PDF로 취합
pdf: docker-config
	@mkdir -p $(DIST_DIR)
	@echo "▶ 캡처용 이미지 빌드 (한글/이모지 폰트 포함, 캐시됨)..."
	@$(DOCKER) build -q -f $(REPO_ROOT)/web/tools/Dockerfile.pdf -t $(PDF_IMAGE) $(REPO_ROOT)/web/tools
	@echo "▶ 슬라이드 PNG 캡처 및 PDF 취합 (Playwright headless Chromium)..."
	@$(DOCKER) run --rm \
		-v $(REPO_ROOT)/web:/work/web \
		-v $(DIST_DIR):/work/dist \
		-w /work/web/tools \
		$(PDF_IMAGE) \
		bash -lc "npm install --no-audit --no-fund && node capture-pdf.mjs"
	@echo "▶ PDF 생성 완료: $(PDF_OUT)"
