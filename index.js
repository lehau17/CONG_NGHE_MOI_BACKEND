import appSocket from "./src/socketIO.js";

const PORT = process.env.PORT || 5000;
appSocket.server.listen(PORT, () => {
    console.log(`✅ Server with Socket.IO is running at http://localhost:${PORT}`);
});
