FROM node:alpine

LABEL maintainer="pedroetb@gmail.com"

COPY package.json package-lock.json index.js /

RUN npm i

ARG PORT=3000
EXPOSE ${PORT}

CMD ["node", "index"]
