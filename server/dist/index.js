import { app } from "./app.js";
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
    console.log(`[QuickOrder API] Listening on http://${HOST}:${PORT}`);
    console.log(`[QuickOrder API] Environment: ${process.env.NODE_ENV || "development"}`);
});
