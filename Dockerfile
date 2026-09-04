FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Expose port (7860 for Hugging Face, 3000 for standard)
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
