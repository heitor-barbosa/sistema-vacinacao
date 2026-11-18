# Etapa 1: gera os arquivos estáticos do React.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Por padrão, o navegador chama /api no mesmo endereço do frontend,
# e o Nginx encaminha essas requisições para o backend.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: serve os arquivos com Nginx.
FROM nginx:1.27-alpine

# PORT pode ser definida pela hospedagem.
# API_UPSTREAM é o endereço interno ou público do backend, sem barra final.
ENV PORT=80 \
    API_UPSTREAM=http://backend:8000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
