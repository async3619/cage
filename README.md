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

(almost) realtime unfollower detection for any social services 🦜⛓️ 🔒

Options:
  -c, --config <path>  path to the configuration file (default: "./config.json")
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

| Service   |      Support?       |
| --------- | :-----------------: |
| Twitter   | ⚠️ (Partially, WIP) |
| Instagram |         ❌          |
| TikTok    |         ❌          |
| YouTube   |         ❌          |
| Twitch    |         ❌          |
| Facebook  |         ❌          |
| Reddit    |         ❌          |
| Discord   |         ❌          |
| GitHub    |         ❌          |

### Notifiers

When we detect unfollowers, new followers, or any other events, Cage will notify you via `Notifiers`.

#### Supported Notifiers

| Service         | Support? |
| --------------- | :------: |
| Discord WebHook |    ✅    |
| Slack WebHook   |    ❌    |
| Telegram Bot    |    ❌    |
| Email           |    ❌    |
| SMS             |    ❌    |

## Configuration

this application reads configuration file from `./cage.config.json` by default.

you can use json schema file `config.schema.json` on this repository. here is example configuration file content:

```json
{
    "watchers": {
        "twitter": {
            "type": "twitter"
        }
    },
    "watchInterval": 60000,
    "notifiers": {
        "discord": {
            "type": "discord",
            "webhookUrl": "https://discord.com/api/webhooks/..."
        }
    }
}
```
