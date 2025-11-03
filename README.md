# ECE1778project

## backend

### setup

navigate to backend folder, build backend develop container by

> docker build . -t backend:latest

for develop environment, use


> docker-compose --profile dev up -d

for release environment, use

> docker-compose --profile release up -d

all profile provides following service:

mysql on port 3306, redis on port 6379, elasticsearch on port 9200

dev profile provies extra visualization tools:

phpmyadmin on port 8080, redis insight on port 5540, kibana on port 5601, backend-dev-container on 8000

init elasticsearch index by running esIndexInit.py this will set up tokenizer for search

#### important

MYSQL_ROOT_PASSWORD environment variable ***must*** be set to start mysql

development code will be mapped into dev container so that it will be on the same network to other services

changing of dependency need to rebuild the image

### documentation

api document available at /api/docs

### real time chat API

when user login, the mobile device will establish a websocket connection with server by ws://localhost:8000/chat/, 
with a header "username". backend will save a mapping between username and this connection.

when sending a chat message, the format should be like this

```json
{
    "type": "chat_message",
    "me": "alice",
    "peer": "bob",
    "message": "hello"
}
```
the peer will receive a message like this
```json
{
    "type": "chat_message",
    "message": "hello",
    "sender": "alice"
}
```

### running tests

To run backend unit tests inside the Docker container:

#### run all tests

```bash
docker compose exec backend python manage.py test
```

#### Run tests for a specific app

```bash
docker compose exec backend python manage.py test user
```
```bash
docker compose exec backend python manage.py test order
```
```bash
docker compose exec backend python manage.py test product
```
```bash
docker compose exec backend python manage.py test chat
```