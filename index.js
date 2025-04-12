import appSocket from "./src/socketIO.js";

appSocket.app

appSocket.app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
