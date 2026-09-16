FROM node:24.10-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:24.10-alpine AS production-dependencies-env
COPY ./package.json ./pnpm-lock.yaml /app/
WORKDIR /app
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

FROM node:24.10-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN corepack enable pnpm && pnpm build

FROM node:24.10-alpine
COPY ./package.json ./pnpm-lock.yaml ./vite.cli.config.ts ./tsconfig.json ./config.enc.env /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# pnpm start runs config:check via vite-node against source, not the bundled
# build, so its import graph (app/config, app/config_schemas, scripts) and the
# encrypted config it decrypts at runtime need to exist here too.
COPY ./app/config /app/app/config
COPY ./app/config_schemas /app/app/config_schemas
COPY ./scripts /app/scripts
WORKDIR /app
RUN corepack enable pnpm
CMD ["pnpm", "start"]
