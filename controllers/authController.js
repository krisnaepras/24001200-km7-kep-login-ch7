require("dotenv").config();
const prisma = require("../models/prismaClients");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailer");
// const { Server } = require("socket.io");
// const io = new Server();

const JWT_SECRET = process.env.JWT_SECRET;

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

            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                io.emit("registrationError", "Email sudah terdaftar");
                return res.render("register", {
                    title: "Register",
                    error: "Email telah terdaftar",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                },
            });

            io.emit('connectt')
            io.emit(
                "welcomeNotification",
                `Welcome, ${email}! Akun anda telah berhasil dibuat.`
            );

            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
            const confirmationLink = `http://${req.get(
                "host"
            )}/auth/confirm-email${token}`;

            await sendEmail(
                email,
                "Email Confirmation",
                `Click here: ${confirmationLink}`
            );

                res.redirect("/auth/login");
        } catch (error) {
            console.log(error);
            io.emit("registrationError", "Terjadi kesalahan pada server.");
            res.status(500).json({
                message: "Terjadi kesalahan pada server.",
            });
        }
    }

    static async confirmEmail(req, res) {
        try {
            const { token } = req.params;
            if (!token) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "Invalid token",
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "Invalid token",
                });
            }

            const user = await prisma.user.findUnique({
                where: { email: decoded.email },
            });

            if (!user) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "User not found",
                });
            }

            await prisma.user.update({
                where: { email: decoded.email },
                data: { confirmed: true },
            });

            io.emit(
                "emailConfirmed",
                `Email ${decoded.email} telah berhasil dikonfirmasi`
            );

            res.render("confirm-email", {
                title: "Confirm Email",
                error: null,
                message: "Email telah berhasil dikonfirmasi. Silahkan login.",
            });
        } catch (error) {
            console.log(error);
            return res.render("confirm-email", {
                title: "Confirm Email",
                error: "Internal server error",
            });
        }
    }

    static async loginPage(req, res) {
        res.render("login", {
            title: "Sign in",
            error: null,
        });
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
