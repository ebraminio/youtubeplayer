FROM alpine
RUN apk update && \
    apk add nodejs

WORKDIR /app
ADD server.js /app/server.js
ADD package.json /app/package.json
RUN npm install
EXPOSE 9090
ENTRYPOINT npm start
