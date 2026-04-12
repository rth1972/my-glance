module.exports = function register(app, config) {
    const broadcast = app.get("broadcast");

    setInterval(() => {
        const now = new Date();
        const tz = config.timezone || "America/New_York";
        broadcast("time", {
            time: now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }),
            date: now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }),
        });
    }, 1000);

    app.get("/api/time", async (req, res) => {
        const now = new Date();
        const tz = config.timezone || "America/New_York";
        res.json({
            time: now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }),
            date: now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }),
        });
    });
};
