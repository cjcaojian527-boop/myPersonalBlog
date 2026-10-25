FROM node:20-alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

WORKDIR /src

COPY package*.json ./
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com

COPY . .

EXPOSE 3002
CMD ["node", "src/index.js"]