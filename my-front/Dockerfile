
FROM nginx:alpine
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

COPY dist /usr/share/nginx/html/blog

COPY nginx.conf /etc/nginx/conf.d/default.conf

# 声明这个容器对外提供 80 端口
EXPOSE 80
