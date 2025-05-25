FROM node:20 as build

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm i --legal-peer-deps

COPY . .

CMD ["npm","run" ,"start"]
