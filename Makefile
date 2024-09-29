# Define las variables para el nombre del servicio y el puerto
SERVICE_NAME := app
SERVICE_CONTAINER_NAME := api-master
PORT := 3011

# Define las variables para los comandos de Docker Compose
DOCKER_COMPOSE_UP := docker-compose -f docker-compose.yml up -d
DOCKER_COMPOSE_DOWN := docker-compose -f docker-compose.yml down
DOCKER_COMPOSE_RM := docker-compose -f docker-compose.yml rm $(SERVICE_CONTAINER_NAME)
DOCKER_COMPOSE_REBUILD := docker-compose -f docker-compose.yml build --no-cache

# Define el comando para ejecutar la aplicación
run:
	$(DOCKER_COMPOSE_UP)

# Define el comando para detener la aplicación
stop:
	$(DOCKER_COMPOSE_DOWN)

# Define el comando para eliminar la aplicación
rm:
	$(DOCKER_COMPOSE_RM)

# Define el comando para detener y eliminar la aplicación
down:
	$(DOCKER_COMPOSE_DOWN)

# Define el comando para recompilar la aplicación y reiniciar el contenedor
rebuild:
	$(DOCKER_COMPOSE_REBUILD)
	$(DOCKER_COMPOSE_UP)

# Define el comando para verificar la imagen de Docker
build:
	docker build -t $(SERVICE_CONTAINER_NAME) -f DockerfileDebug .

logs:
	docker-compose -f docker-compose.yml logs -f $(SERVICE_NAME)

# Define el comando para instalar las dependencias
install:
	npm install

# Define el comando para ejecutar el comando "start:dev"
start:
	npm run start:dev

# Define el comando para construir la aplicación
build_app:
	npm run build