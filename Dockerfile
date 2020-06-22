FROM node:12.16.3-alpine

WORKDIR /app

RUN apk add --no-cache git
RUN git clone https://github.com/MyWebIntelligence/MyWebClient.git .
RUN yarn install && cd client && yarn install && cd ..

CMD ["yarn", "standalone"]