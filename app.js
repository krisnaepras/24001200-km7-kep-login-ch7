require("dotenv").config();
require("./instrument");
const express = require("express");
const bodyParser = require("body-parser");
const Sentry = require("@sentry/node");
const app = express();
const authRouter = require("./routes/authRoutes");
const path = require("path");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
    req.io = io;
    next();
  });
  
app.use("/auth", authRouter);

Sentry.setupExpressErrorHandler(app);

const server = app.listen(PORT, () => {
    console.log(`Server jalan jalan di port ${PORT}`);
});

const io = new Server(server);

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("User  disconnected");
    });
});
