FROM node:20-alpine as build

WORKDIR /app

COPY package.json ./
RUN npm i --legal-peer-deps

COPY . .

CMD ["npm","run" ,"start"]
