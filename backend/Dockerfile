FROM node:25
RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]