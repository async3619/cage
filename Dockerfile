FROM node:22-alpine as builder

RUN apk add --update --no-cache curl git openssh openssl

USER node
WORKDIR /home/node

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock ./
RUN yarn install --frozen-lockfile

COPY --chown=node:node . .

ARG NODE_ENV=production
ARG APP_ENV=production

ENV NODE_ENV ${NODE_ENV}

RUN ["yarn", "build"]

FROM node:22-alpine as prod-deps

USER node
WORKDIR /home/node

# copy from build image
COPY --from=builder /home/node/yarn.lock ./yarn.lock
COPY --from=builder /home/node/package.json ./package.json
RUN yarn install --frozen-lockfile --prod

ARG NODE_ENV=production
ARG APP_ENV=production

ENV NODE_ENV ${NODE_ENV}

CMD [ "node", "dist/src/index" ]

FROM node:22-alpine as production

USER node
WORKDIR /home/node

# copy from build image
COPY --from=prod-deps /home/node/node_modules ./node_modules
COPY --from=builder /home/node/dist ./dist
COPY --from=builder /home/node/yarn.lock ./yarn.lock
COPY --from=builder /home/node/package.json ./package.json
RUN yarn install --frozen-lockfile --prod

ARG NODE_ENV=production
ARG APP_ENV=production

ENV NODE_ENV ${NODE_ENV}

CMD [ "node", "dist/src/index" ]
