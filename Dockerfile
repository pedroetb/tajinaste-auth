ARG NODE_IMAGE_TAG=12.16.1-alpine3.11
FROM node:${NODE_IMAGE_TAG}

LABEL maintainer="pedroetb@gmail.com"

COPY package.json package-lock.json index.js /app

WORKDIR /app
RUN npm i

ARG PORT=3000
EXPOSE ${PORT}

CMD ["node", "index"]
