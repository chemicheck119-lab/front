FROM node:24-bookworm-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_BUILD_MODE=demo
RUN case "$VITE_BUILD_MODE" in demo|staging) ;; *) echo "unsupported VITE_BUILD_MODE: $VITE_BUILD_MODE" >&2; exit 1 ;; esac \
    && pnpm build --mode "$VITE_BUILD_MODE"

FROM nginx:stable-alpine

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
