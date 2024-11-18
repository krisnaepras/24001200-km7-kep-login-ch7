require("dotenv").config();
const prisma = require("../models/prismaClients");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET

class AuthController {

    static async registerPage(req, res) {
        res.render("register", {
            title: "Register",
            error: null,
        });
    }

    static async register(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: "Email dan Password harus diisi" });
            }

            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return res.status(400).json({ error: "Email telah terdaftar" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                },
            });

            const token = jwt.sign({email}, JWT_SECRET, {expiresIn: '1h'})
            const confirmationLink = `${req.protocol}://${req.get("host")}/auth/confirm-email${token}`

            await sendEmail(email, "Email Confirmation", `Click here: ${confirmationLink}`)

            res.redirect();
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Terjadi kesalahan pada server.",
            });
        }
    }



    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ message: "Email dan Password harus diisi" });
            }
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user && !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: "Invalid credential" });
            }
            const token = jwt.sign({ id: user.id }, JWT_SECRET, {
                expiresIn: "1h",
            });
            res.status(200).json({ token });
        } catch (error) {
            res.status(400).json({ error: "Error logging in" });
        }
    }

    static async dashboard(req, res) {
        res.status(200).json({
            message: "Success Login",
        });
    }
}

module.exports = AuthController;
