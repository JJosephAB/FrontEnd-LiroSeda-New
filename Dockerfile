# Etapa 1: compilar Angular
FROM node:24-alpine AS build

WORKDIR /app

# Instalar dependencias usando el archivo de versiones
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código y la configuración
COPY . .

# Generar los archivos de producción
RUN npm run build -- \
    --configuration production \
    --output-path=dist/lirio-angular


# Etapa 2: servir la aplicación
FROM nginx:stable-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build \
    /app/dist/lirio-angular/browser \
    /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]