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
  // ============================================================
  pages: [

    // ── Page 1: Home ──────────────────────────────────────────
    {
      name: "Home",
      columns: [
        {
          size: "small",
          widgets: [
            { type: "time" },
            { type: "calendar" },
            { type: "weather" },
          ],
        },
        {
          size: "full",
          widgets: [
            { type: "monitor" },
            { type: "feeds" },
          ],
        },
        {
          size: "small",
          widgets: [
            { type: "shoutcast" },
            { type: "bookmarks" },
          ],
        },
      ],
    },

    // ── Page 2: Studio ────────────────────────────────────────
    {
      name: "Studio",
      columns: [
        {
          size: "small",
          widgets: [
            //{ type: "shoutcast" },   // radio station — now playing + player
            //{ type: "navidrome" },   // now playing + recently played
            { type: "wallpaper" },   // Bing wallpaper of the day
          ],
        },
        {
          size: "full",
          widgets: [
            { type: "techfeeds" },   // tech/self-hosted RSS feeds
          ],
        },
        {
          size: "small",
          widgets: [
            { type: "notes" },       // quick links / notes
          ],
        },
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

  // ── Feeds (Home page) ─────────────────────────────────────
  feeds: [
    {
      url: "https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNSHByYzNnU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en",
      title: "Google News",
    },
  ],
  feedsLimit: 30,

  // ── Tech Feeds (Studio page) ──────────────────────────────
  techFeeds: [
    { url: "https://blog.robintehofstee.com/rss.xml", title: "Personal Blog"  },
    { url: "https://www.theregister.com/headlines.atom",               title: "The Register"  },
  ],
  techFeedsLimit: 20,

  // ── SHOUTcast ─────────────────────────────────────────────
  // The widget fetches stats via the backend to avoid CORS issues.
  // streamUrl is what the audio player actually plays in the browser.
  shoutcast: {
    // Internal URL used by the server to fetch stats (can be local IP)
    statsUrl:   "https://carreenradio.com:8840",
    // Stream URL the browser will play — must be reachable from the user's browser
    streamUrl:  "https://carreenradio.com:8840/stream",
    // Station display name
    name:       "Carreen Radio",
    // How many recent tracks to show
    historyCount: 8,
  },

  // ── Navidrome ─────────────────────────────────────────────
  navidrome: {
    url:         "http://192.168.1.75:4533",
    user:        "robin30",
    password:    "1972Robinth!",
    recentCount: 6,
  },

  // ── Notes / Quick Links (Studio page) ────────────────────
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

  // ── Monitor ───────────────────────────────────────────────
  monitor: [
    { title: "Proxmox",             url: "https://192.168.1.27:8006"  },
    { title: "Portainer",           url: "https://192.168.1.100:9443" },
    { title: "Nginx Proxy Manager", url: "http://192.168.1.66:81"     },
    { title: "Gitea",               url: "http://192.168.1.83:3000"   },
    { title: "Navidrome",           url: "http://192.168.1.75:4533"   },
    { title: "Termix",              url: "http://192.168.1.24/"       },
  ],

  // ── Bookmarks (Home page) ─────────────────────────────────
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
