# Usar una imagen base de Node.js con la versión que necesites
FROM node:18

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de la aplicación NestJS al contenedor
COPY ./package*.json ./
COPY ./tsconfig*.json ./
COPY ./src ./src

# Instalar las dependencias de la aplicación
RUN npm install

# Exponer el puerto en el que se ejecutará la aplicación NestJS
EXPOSE $PORT

# Comando para ejecutar la aplicación
#CMD ["npm", "start"]
CMD if [ "$NODE_ENV" = "production" ]; then \
      npm start; \
    else \
      npm run start:dev; \
    fi