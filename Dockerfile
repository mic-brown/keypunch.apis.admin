FROM node:alpine

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .
RUN npm install
RUN npm run build
EXPOSE 8080
CMD [ "npm", "start" ]