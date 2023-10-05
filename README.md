# Prueba Nestjs Dockerizado

Una prueba de implementación de nestjs y mongodb Dockerizado

## Requisitos Previos

Asegúrate de tener instalados los siguientes requisitos en tu sistema antes de continuar:

- Node.js (versión 18.16.0)
- Docker (opcional para ejecución en contenedores)

## Configuración

1. Clona este repositorio en tu máquina local:

   ```bash
   git clone https://github.com/zzleomar/testnestjs

2. Crea un archivo .env basado en el archivo .env.example. Puedes utilizar este último como guía. Asegúrate de definir las siguientes variables:

 - PORT: El puerto en el que se ejecutará la aplicación.
 - DATABASE_URI: La URL de conexión a tu base de datos MongoDB.
 - NODE_ENV: Debe establecerse en production o development según el modo de ejecución.

3. Instala las dependencias del proyecto:
   ```bash
    npm install

### Ejecución en Contenedores Docker Creando la imagen
Si prefieres ejecutar la aplicación en contenedores Docker, asegúrate de tener Docker instalado y sigue estos pasos:
   ```bash
  docker-compose up --build
```
La aplicación se ejecutará en un contenedor Docker y estará disponible en el puerto especificado en tu archivo .env.

### Ejecución en Contenedores Docker con la imagen Creada
   ```bash
  docker-compose up
```
La aplicación se ejecutará en un contenedor Docker y estará disponible en el puerto especificado en tu archivo .env.

### Ejecución en Modo Desarrollador
  Para ejecutar la aplicación en modo de desarrollo y habilitar la recarga en caliente (hot reload):

   ```bash
  npm run start:dev
```

### Ejecución en Modo Producción
  Para ejecutar la aplicación en modo de desarrollo y habilitar la recarga en caliente (hot reload):

   ```bash
  npm run start
```