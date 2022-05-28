ARG NODE_IMAGE_TAG=18.2.0-alpine3.15

FROM node:${NODE_IMAGE_TAG}

LABEL maintainer="pedroetb@gmail.com"

COPY package.json package-lock.json index.js /app/

WORKDIR /app

RUN npm i

ENV PORT=3000 \
	NODE_ENV=production

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=15s --start-period=1m --retries=10 \
	CMD wget --spider -q http://localhost:${PORT}/health || exit 1

CMD ["node", "index"]
