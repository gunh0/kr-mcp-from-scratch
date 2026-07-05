# MCP 야호~! 학습자료 정적 사이트를 서빙하는 경량 nginx 이미지
FROM nginx:1.27-alpine

# 기본 nginx 설정 대신 SPA/정적 사이트에 맞춘 설정 사용
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 학습자료 정적 파일 배치
COPY index.html /usr/share/nginx/html/index.html
COPY script.js /usr/share/nginx/html/script.js

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
