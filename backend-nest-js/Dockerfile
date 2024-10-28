# syntax = docker/dockerfile:1
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim as base
LABEL fly_launch_runtime="NestJS"
WORKDIR /app
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build
COPY package-lock.json package.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Final stage for app image
FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "npm", "run", "start" ]
