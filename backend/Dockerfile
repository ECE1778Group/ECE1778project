FROM python:3.13 AS base


COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
EXPOSE 80

FROM base AS dev
RUN chmod +x /bin/bash
WORKDIR /backend/

FROM base AS release
COPY ./ /backend
WORKDIR /backend/

