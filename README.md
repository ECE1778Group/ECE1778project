# Final report
## Team Information
## Motivation
## Objectives
## Technical Stack
### Mobile frontend
```text

```
### Backend
```text
Django rest framework, Elasticsearch, Redis, Nginx, Docker, Mysql
```
## Features
## User Guide

## Development Guide
#### important: 
```text
due to network issue, backend may not run on the same machine with client.
the client should change the BASE_URL and IMAGE_URL_PREFIX in constant.ts to point to the real backend IP address
The localhost in mobile app point to itself.
even If you are using emulator, backend network may not be accessible from emulator network.
To test network setup, visit http://{backend_ip}:8000/api/docs,
if you can see the page, you can access backend from this device
There are two options so far,
1. run the backend in different machine in Lan, use development build for client in the emulator.
2. run the client on your real phone, use expo go.

To start backend, MYSQL_ROOT_PASSWORD environment variable must be set to start mysql
```
### backend setup
navigate to backend folder, build backend develop container by

> docker build . -t backend:latest

for develop environment, use

> docker-compose --profile dev up -d

for release environment, use

> docker-compose --profile release up -d
```text
all profile provides following service:
mysql on port 3306, redis on port 6379, elasticsearch on port 9200

dev profile provies extra visualization tools:
phpmyadmin on port 8080, redis insight on port 5540, kibana on port 5601, backend-dev-container on 8000

init elasticsearch index by running esIndexInit.py this will set up tokenizer for search (auto run in dev container)
initTestUser.py creates a test user "testuser" alice with password "test", "testuser2" bob with password "test" (auto run in dev container)
development code will be mapped into dev container so that it will be on the same network to other services
changing of dependency need to rebuild the image
```


### documentation

backend api document available at http://{backend_ip}:8000/api/docs

### real time chat API

when user login, the mobile device will establish a websocket connection with server by ws://localhost:8000/chat/.

backend will save a mapping between username and this connection.

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
## Deployment Information
## Individual Contributions
## Lessons Learned and Concluding Remarks
```text
1. assigning tasks to different members with no overlapping duty is very efficient.
2. API programming(swagger ui) is important at the beginning of the project. It helps members to understand their tasks.
3. changing API is expensive in developing
4. tests helps to prevent feature break during developing
The development should follow this pattern:
API programming(backend) | -> backend development
                         | -> frontend development
                         | -> test development(API testing)
5. docker provides a consistent development environment.
```