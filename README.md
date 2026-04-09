# my-glance

A personal dashboard — your own lightweight Glance alternative.

## Setup

```bash
cd ~/Documents/my-glance
npm install
npm start
```

Then open → http://localhost:3333

## Configuration

**Edit `config.js` — that's the only file you need to touch.**

| Section     | What to change |
|-------------|----------------|
| `port`      | Port to run on (default 3333) |
| `markets`   | Stock/crypto symbols and display names |
| `weather`   | Your lat/lon, city name, and `imperial` or `metric` |
| `feeds`     | RSS/Atom feed URLs and titles |
| `monitor`   | Local service URLs to ping |
| `bookmarks` | Grouped links with emoji icons |

## Running as a service on your Ubuntu server

```bash
# Install pm2
npm install -g pm2

# Start
pm2 start server.js --name my-glance

# Auto-start on reboot
pm2 startup
pm2 save
```

## Project structure

```
my-glance/
├── config.js       ← ONLY file you edit
├── server.js       ← Express backend
├── package.json
└── public/
    └── index.html  ← Frontend
```
