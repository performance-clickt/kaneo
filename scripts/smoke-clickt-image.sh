#!/bin/sh
set -eu

usage() {
  echo "usage: $0 IMAGE SOURCE REVISION VERSION UPSTREAM_VERSION RESKIN_REVISION [ARCHITECTURE]" >&2
  exit 64
}

[ "$#" -ge 6 ] && [ "$#" -le 7 ] || usage

image=$1
expected_source=$2
expected_revision=$3
expected_version=$4
expected_upstream_version=$5
expected_reskin_revision=$6
expected_architecture=${7:-}

suffix="$$"
network="clickt-image-smoke-network-$suffix"
postgres_container="clickt-image-smoke-postgres-$suffix"
app_container="clickt-image-smoke-app-$suffix"
database_password="clickt-image-smoke-password-$suffix"

cleanup() {
  docker rm --force "$app_container" >/dev/null 2>&1 || true
  docker rm --force "$postgres_container" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 69
}

docker image inspect "$image" >/dev/null

assert_label() {
  label=$1
  expected=$2
  actual=$(docker image inspect --format "{{ index .Config.Labels \"$label\" }}" "$image")
  if [ "$actual" != "$expected" ]; then
    echo "label $label mismatch: expected '$expected', got '$actual'" >&2
    exit 1
  fi
}

assert_label org.opencontainers.image.source "$expected_source"
assert_label org.opencontainers.image.revision "$expected_revision"
assert_label org.opencontainers.image.version "$expected_version"
assert_label org.opencontainers.image.licenses MIT
assert_label io.clickt.kaneo.upstream-version "$expected_upstream_version"
assert_label io.clickt.kaneo.reskin-revision "$expected_reskin_revision"

if [ -n "$expected_architecture" ]; then
  actual_architecture=$(docker image inspect --format '{{ .Architecture }}' "$image")
  if [ "$actual_architecture" != "$expected_architecture" ]; then
    echo "architecture mismatch: expected '$expected_architecture', got '$actual_architecture'" >&2
    exit 1
  fi
fi

docker network create "$network" >/dev/null

docker run --detach \
  --name "$postgres_container" \
  --network "$network" \
  --tmpfs /var/lib/postgresql/data:rw,noexec,nosuid,size=512m \
  --env POSTGRES_DB=kaneo \
  --env POSTGRES_USER=kaneo \
  --env POSTGRES_PASSWORD="$database_password" \
  postgres:16-alpine >/dev/null

attempt=0
until docker exec "$postgres_container" pg_isready --username kaneo --dbname kaneo >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "PostgreSQL did not become ready" >&2
    docker logs "$postgres_container" >&2
    exit 1
  fi
  sleep 1
done

docker run --detach \
  --name "$app_container" \
  --network "$network" \
  --publish 127.0.0.1::5173 \
  --env POSTGRES_HOST="$postgres_container" \
  --env POSTGRES_DB=kaneo \
  --env POSTGRES_USER=kaneo \
  --env POSTGRES_PASSWORD="$database_password" \
  --env AUTH_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  --env KANEO_CLIENT_URL=http://127.0.0.1:5173 \
  "$image" >/dev/null

host_port=$(docker port "$app_container" 5173/tcp | awk -F: 'NR == 1 { print $NF }')
[ -n "$host_port" ] || {
  echo "Docker did not allocate a host port" >&2
  exit 1
}
base_url="http://127.0.0.1:$host_port"

attempt=0
until health=$(curl --fail --silent --show-error "$base_url/api/health" 2>/dev/null); do
  attempt=$((attempt + 1))
  if ! docker inspect --format '{{ .State.Running }}' "$app_container" 2>/dev/null | grep -qx true; then
    echo "Clickt container exited before becoming healthy" >&2
    docker logs "$app_container" >&2
    exit 1
  fi
  if [ "$attempt" -ge 120 ]; then
    echo "Clickt API did not become ready" >&2
    docker logs "$app_container" >&2
    exit 1
  fi
  sleep 1
done

printf '%s' "$health" | grep -q '"status":"ok"'
curl --fail --silent --show-error "$base_url/" | grep -q '<title>Clickt HiveMind</title>'
curl --fail --silent --show-error "$base_url/logo-dark.svg" | grep -q 'Clickt HiveMind'
manifest=$(curl --fail --silent --show-error "$base_url/site.webmanifest")
printf '%s' "$manifest" | grep -q '"name"[[:space:]]*:[[:space:]]*"Clickt HiveMind"'

logs=$(docker logs "$app_container" 2>&1)
printf '%s' "$logs" | grep -q 'Database migrated successfully!'
printf '%s' "$logs" | grep -q 'API is ready'

echo "Clickt image smoke passed: $image ($base_url)"
