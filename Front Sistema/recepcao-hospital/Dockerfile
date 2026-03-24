# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Execução com Nginx para servir o app construído pelo Vite
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração para que o roteamento do React (React Router) funcione com o Nginx
RUN rm /etc/nginx/conf.d/default.conf
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]