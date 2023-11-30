# Usar una imagen base de Node.js con la versión que necesites
FROM node:18-alpine

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de la aplicación NestJS al contenedor
COPY ./package*.json ./
COPY ./tsconfig*.json ./
COPY ./src ./src

#Copiar archivo .env
ARG DOTENV PORT
RUN echo $DOTENV | base64 -d  > .env

# Instalar las dependencias de la aplicación
RUN npm install

#Efectuar build
RUN npm run build

# Exponer el puerto en el que se ejecutará la aplicación NestJS
EXPOSE $PORT

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
