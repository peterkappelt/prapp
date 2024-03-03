FROM python:3.12-alpine as deps
WORKDIR /app

ENV PIPENV_VENV_IN_PROJECT=1

RUN apk add --update alpine-sdk libffi-dev postgresql-libs
# required for psycopg
RUN apk add --no-cache postgresql-dev musl-dev


ADD Pipfile.lock Pipfile /app/
RUN pip install pipenv
RUN pipenv sync
RUN pipenv install gunicorn psycopg2

FROM python:3.12-alpine as runtime
EXPOSE 8000
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN mkdir /app/.venv
COPY --from=deps /app/.venv /app/.venv
RUN pip install pipenv

COPY . /app

RUN chown -R app:app /app
USER app
CMD ["./.venv/bin/gunicorn", "prapp.wsgi", "-b", "0.0.0.0", "--threads", "8"]