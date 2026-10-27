FROM node:26.12.1-slim

WORKDIR /opt/catalog/
COPY ./package*.json ./
RUN npm ci

COPY ./ ./

# Default configuration
ENV PORT="3000"
ENV HOST="0.0.0.0"

EXPOSE 3000

CMD ["npm", "run", "start"]
