# ECE1778project

## backend

### setup

navigate to backend folder,

for develop environment, use


> docker-compose --profile dev up

for release environment, use

> docker-compose --profile release up

all profile provides following service:

mysql on port 3306, redis on port 6379, elasticsearch on port 9200

dev profile provies extra visualization tools:

phpmyadmin on port 8080, redis insight on port 5540, kibana on port 5601

for now, start backend by

> python manage.py runserver 0.0.0.0:{port}

#### important

MYSQL_ROOT_PASSWORD environment variable ***must*** be set to start mysql