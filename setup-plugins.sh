#!/bin/bash
# Run this once to create the new plugin folders
set -e
BASE="$HOME/Documents/my-glance/plugins"

mkdir -p "$BASE/proxmox"
mkdir -p "$BASE/gitea-activity"
mkdir -p "$BASE/uptime-history"

echo "✓ Plugin directories created"
echo "Now run: pm2 restart my-glance"
