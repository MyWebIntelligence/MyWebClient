FROM node:12.16.3-alpine

WORKDIR /app

COPY . .
RUN yarn install

WORKDIR /app/client
RUN yarn install

WORKDIR /app
CMD ["yarn", "standalone"]