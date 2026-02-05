FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Remove devDependencies for smaller production image
RUN npm prune --production

EXPOSE 3005

CMD ["node", "dist/index.js"]

