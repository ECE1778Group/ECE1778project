# ECE1778project

## backend

### setup

navigate to backend folder, build backend develop container by

> docker build . -t backend:latest

for develop environment, use


> docker-compose --profile dev up

for release environment, use

> docker-compose --profile release up

all profile provides following service:

mysql on port 3306, redis on port 6379, elasticsearch on port 9200

dev profile provies extra visualization tools:

phpmyadmin on port 8080, redis insight on port 5540, kibana on port 5601, backend-dev-container on 8000

init elasticsearch index by running esIndexInit.py this will set up tokenizer for search

#### important

MYSQL_ROOT_PASSWORD environment variable ***must*** be set to start mysql

development code will be mapped into dev container so that it will be on the same network to other services

changing of dependency need to rebuild the image