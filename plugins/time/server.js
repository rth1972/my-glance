// No server routes needed
module.exports = function register(app, config) {

    app.get("/api/time", async (req, res) => {
        try {
            const now = new Date();
            const tz = config.timezone || "America/New_York";
            res.json({
                time: now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }),
                date: now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }),
            });

        } catch {
            
        }
});
};
