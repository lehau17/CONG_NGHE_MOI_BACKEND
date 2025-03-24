import dotenv from "dotenv";
import app from "./src/server.js";
dotenv.config();


app().listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
