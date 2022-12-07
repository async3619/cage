<h1 align="center">
  <br />
  🦜
  <br />
  Cage
  <sup>
    <br />
    <br />
  </sup>    
</h1>

<div align="center">
    <a href="https://www.npmjs.com/package/cage-cli">
        <img alt="npm (tag)" src="https://img.shields.io/npm/v/cage-cli/dev?style=flat-square">
    </a>
    <a href="https://github.com/async3619/solv/blob/main/LICENSE">
        <img src="https://img.shields.io/github/license/async3619/solv.svg?style=flat-square" alt="MIT License" />
    </a>
    <a href="https://app.codecov.io/gh/async3619/cage">
        <img alt="Codecov" src="https://img.shields.io/codecov/c/github/async3619/cage?style=flat-square&token=97JBTXGXC8">
    </a>
    <br />
    <sup>(almost) realtime unfollower detection for any social services</sup>
    <br />
    <br />
</div>

## Introduction

Cage is a cli application for detecting unfollowers on any social services. this application will check all of your followers using each watcher and compare them to the previous check. if there is a difference, it will notify you of the changes.

## Usage

```bash
$ npm install -g cage-cli

$ cage --help

Usage: cage [options]

(almost) realtime unfollower detection for any social services 🦜⛓️🔒

Options:
  -c, --config <path>  path to the configuration file (default: "./config.json")
  -d, --drop-database  delete the old database file
  -v, --verbose        enable verbose level logging
  -V, --version        output the version number
  -h, --help           display help for command
```

or you can just deploy with `docker` if you want:

```bash
$ docker run -d --name cage async3619/cage -v /path/to/config.json:/home/node/config.json
```

of course, you can also use `docker-compose`:

```yaml
version: "3.9"

services:
    cage:
        image: async3619/cage
        volumes:
            - /path/to/config.json:/home/node/config.json
```

## Watchers and Notifiers

### Watchers

`Watchers` are independent feature that has the ability to watch to check users who follow your account per service.

#### Supported Watchers

| Service   | Support? |
|-----------|:--------:|
| Twitter   |    ✅     |
| GitHub    |    ✅     |
| Instagram |    ❌     |
| TikTok    |    ❌     |
| YouTube   |    ❌     |
| Twitch    |    ❌     |
| Facebook  |    ❌     |
| Reddit    |    ❌     |
| Discord   |    ❌     |

### Notifiers

When we detect unfollowers, new followers, or any other events, Cage will notify you via `Notifiers`.

#### Supported Notifiers

| Service         | Support? |
|-----------------|:--------:|
| Discord WebHook |    ✅     |
| Slack WebHook   |    ❌     |
| Telegram Bot    |    ❌     |
| Email           |    ❌     |
| SMS             |    ❌     |

## Configuration

this application reads configuration file from `./cage.config.json` by default.
if there's no configuration file to read, this application will create you a default configuration file for you:

```json
{
    "watchInterval": 60000,
    "watchers": {},
    "notifiers": {}
}
```

you can use json schema file `config.schema.json` on this repository.

### watchInterval: `number` (required)

specify watching interval in millisecond format. minimal value is `60000`.

### watchers: `Record<string, WatcherOptions>` (required)

#### twitter

```json5
{
    "type": "twitter", // required

    // one of these...
    "auth": {
        "type": "api-key", // required
        "apiKey": "API key of your twitter app", // string, required
        "apiSecret": "API secret of your twitter app" // string, required
    },

    // or ...
    "auth": {
        "type": "bearer-token", // required
        "bearerToken": "bearer token of your twitter app" // string, required
    },

    // or ...
    "auth": {
        "type": "basic", // required
        "username": "user id of your twitter account (e.g. @user_account)", // string, required
        "password": "password of your twitter account" // string, required
    }
}
```

#### github

watcher configuration for GitHub service.

```json5
{
    "type": "github", // required
    "authToken": "personal access token of your github account" // string, required
}
```

### notifiers: `Record<string, NotifierOptions>` (required)

#### discord

notifier configuration for Discord WebHook notifier.

```json5
{
    "type": "discord",
    "webhookUrl": "Discord WebHook url" // string, required
}
```
