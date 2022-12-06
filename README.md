<h1 align="center">
  <br />
  🐦
  <br />
  Cage
  <sup>
    <br />
    <br />
  </sup>    
</h1>

<div align="center">
    <a>
        <img alt="npm" src="https://img.shields.io/npm/v/cage-cli?style=flat-square">
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

Cage is a cli application for detecting unfollowers on any social services.

## Usage

```bash
$ npm install -g cage-cli

$ cage --help
```

## Supported Services

### Watchers

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

| Service         | Support? |
| --------------- | :------: |
| Discord WebHook |    ✅    |

## Configuration

this application reads configuration file from `./cage.config.json` by default.

You can use json schema file `config.schema.json` on this repository. here is example configuration file content:

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
