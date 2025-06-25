FROM node:12.16.3-alpine

WORKDIR /app

COPY . .
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python \
    && yarn install
# Check package.json for postinstall scripts

WORKDIR /app
CMD ["yarn", "standalone"]
