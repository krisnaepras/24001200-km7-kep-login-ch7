require("dotenv").config();
require("./instrument");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Sentry = require("@sentry/node");
const app = express();
const authRouter = require("./routes/authRoutes");
const path = require("path");
const socket = require("./middleware/socket");
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/auth", authRouter);

Sentry.setupExpressErrorHandler(app);

const server = app.listen(PORT, () => {
    console.log(`Server jalan jalan di port ${PORT}`);
});

socket.init(server); 
