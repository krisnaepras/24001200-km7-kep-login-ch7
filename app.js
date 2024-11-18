require('dotenv').config()
require('./instrument')
const express = require('express')
const bodyParser = require('body-parser')
const Sentry = require('@sentry/node')
const app = express()
const userRouter = require('./routes/userRoutes')
const PORT = process.env.PORT || 3000

app.set("view engine", "ejs");
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"));

app.use('/auth', userRouter)

Sentry.setupExpressErrorHandler(app)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})