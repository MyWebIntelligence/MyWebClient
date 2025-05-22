FROM node:20-alpine

WORKDIR /app

COPY . .
RUN yarn install
# Check package.json for postinstall scripts

WORKDIR /app
CMD ["yarn", "standalone"]
