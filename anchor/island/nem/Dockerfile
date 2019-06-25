FROM node:8-alpine as builder
ARG SRC_DIR="."
WORKDIR /app
COPY ${SRC_DIR}/package.json ./
RUN yarn install --no-cache
COPY ${SRC_DIR}/index.ts ${SRC_DIR}/tsconfig.json ${SRC_DIR}/tslint.json ./
COPY ${SRC_DIR}/anchor ./anchor
RUN ["yarn", "build"]

FROM node:8-alpine
LABEL MAINTAINER="Jonathan Tey <jonathan@luxtag.io>"
WORKDIR /app
COPY --from=builder /app/package.json ./
RUN yarn install --no-cache --production
COPY --from=builder /app/anchor ./anchor
COPY --from=builder /app/dist ./
CMD ["node", "index.js"]
