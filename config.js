// ============================================================
//  MY-GLANCE CONFIG — this is the ONLY file you need to edit
// ============================================================

module.exports = {

  // --- Server ---
  port: 3333,
  timezone: "America/New_York",

  // --- Markets (top ticker bar, shown on all pages) ---
  markets: [
    { symbol: "WMT",     name: "Walmart"   },
    { symbol: "BTC-USD", name: "Bitcoin"   },
  ],

  // ============================================================
  //  PAGES
  //  Widget options: position (left/right/full), size (small/full)
  // ============================================================
  pages: [

    // ── Page 1: Home ──────────────────────────────────────────
    {
      name: "Home",
      layout: [
        { type: "time",      position: "left" },
        { type: "calendar", position: "left" },
        { type: "weather",  position: "left" },
        { type: "proxmox",   position: "full" },
        { type: "feeds",     position: "full" },
        { type: "shoutcast", position: "right" },
        { type: "bookmarks", position: "right" },
      ],
    },

    // ── Page 2: Infrastructure ────────────────────────────────
    {
      name: "Infra",
      layout: [
        { type: "proxmox",       position: "left" },
        { type: "uptime-history", position: "full" },
        { type: "gitea-activity",position: "full" },
        { type: "notes",         position: "right" },
      ],
    },

  ],

  // ============================================================
  //  WIDGET DATA
  // ============================================================

  weather: {
    lat:   40.2154,
    lon:  -78.2445,
    city: "Saxton, PA",
    units: "imperial",
  },

  feeds: [
    {
      url: "https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNSHByYzNnU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en",
      title: "Google News",
    },
  ],
  feedsLimit: 30,

  techFeeds: [
    { url: "https://blog.robintehofstee.com/rss.xml", title: "Personal Blog" },
  ],
  techFeedsLimit: 20,

  shoutcast: {
    statsUrl:     "http://192.168.1.100:8050",
    streamUrl:    "https://carreenradio.com:8840/;rain.mp3",
    name:         "Carreen Radio",
    historyCount: 8,
    adminUser:    "admin",
    adminPass:    "your-password",
  },

  navidrome: {
    url:         "http://192.168.1.75:4533",
    user:        "robin30",
    password:    "1972Robinth!",
    recentCount: 6,
  },

  notes: [
    {
      group: "Quick Links",
      links: [
        { title: "Carreen Radio",   url: "https://carreenradio.com",        icon: "📻" },
        { title: "Bing Wallpapers", url: "https://bing.carreenradio.com",   icon: "🖼️" },
        { title: "Email",           url: "http://mail.local",               icon: "📧" },
        { title: "Personal Blog",   url: "https://blog.robintehofstee.com", icon: "✍️" },
        { title: "Portfolio",       url: "https://robintehofstee.com",      icon: "🌐" },
      ],
    },
    {
      group: "Tools",
      links: [
        { title: "Helper Scripts",  url: "https://community-scripts.org/",           icon: "📜" },
        { title: "Proxmox Wiki",    url: "https://pve.proxmox.com/wiki/Main_Page",   icon: "📖" },
        { title: "Gitea",           url: "http://192.168.1.83:3000",                 icon: "🦊" },
      ],
    },
  ],

  monitor: [
    { title: "Proxmox",             url: "https://192.168.1.27:8006"  },
    { title: "Portainer",           url: "https://192.168.1.100:9443" },
    { title: "Nginx Proxy Manager", url: "http://192.168.1.66:81"     },
    { title: "Gitea",               url: "http://192.168.1.83:3000"   },
    { title: "Navidrome",           url: "http://192.168.1.75:4533"   },
    { title: "Termix",              url: "http://192.168.1.24/"       },
  ],

  proxmox: {
    url:     "https://192.168.1.27:8006",
    tokenid: "root@pam!my-glance",
    secret:  "660441ba-acba-4383-8398-4163b7cfe9ed",
    node:    "rth",
  },

  gitea: {
    url:   "http://192.168.1.83:3000",
    user:  "robin30",
    token: "4df28ff4d8bef0cfea3bf95a08401ad1f0280cc8",
  },

  bookmarks: [
    {
      group: "Websites",
      links: [
        { title: "Carreen Radio",   url: "https://carreenradio.com",        icon: "📻" },
        { title: "Bing Wallpapers", url: "https://bing.carreenradio.com",   icon: "🖼️" },
        { title: "Email",           url: "http://mail.local",               icon: "📧" },
        { title: "Personal Blog",   url: "https://blog.robintehofstee.com", icon: "✍️" },
        { title: "Portfolio",       url: "https://robintehofstee.com",      icon: "🌐" },
        { title: "Helper Scripts",  url: "https://community-scripts.org/",  icon: "📜" },
      ],
    },
    {
      group: "Infrastructure",
      links: [
        { title: "Proxmox",             url: "https://192.168.1.27:8006",  icon: "🖥️" },
        { title: "Portainer",           url: "https://192.168.1.100:9443", icon: "🐳" },
        { title: "Nginx Proxy Manager", url: "http://192.168.1.66:81",     icon: "🔀" },
        { title: "Gitea",               url: "http://192.168.1.83:3000",   icon: "🦊" },
        { title: "Navidrome",           url: "http://192.168.1.75:4533",   icon: "🎵" },
      ],
    },
    {
      group: "Docs",
      links: [
        { title: "Proxmox Wiki",   url: "https://pve.proxmox.com/wiki/Main_Page", icon: "📖" },
        { title: "Portainer Docs", url: "https://docs.portainer.io",              icon: "📖" },
        { title: "Gitea Docs",     url: "https://docs.gitea.com",                 icon: "📖" },
      ],
    },
  ],

};
