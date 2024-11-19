require("dotenv").config();
const prisma = require("../models/prismaClients");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailer");
const { getIO } = require("../middleware/socket");

const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {
    static async registerPage(req, res) {
        if (req.cookies && req.cookies.access_token) {
            console.log(req.cookies);
            return res.redirect("/auth/dashboard");
        }
        res.render("register", {
            title: "Register",
            error: null,
        });
    }

    static async register(req, res) {
        try {
            const io = getIO();
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

            io.emit(
                "welcomeNotification",
                `Welcome, ${email}! Akun anda telah berhasil dibuat.`
            );

            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
            const confirmationLink = `http://${req.get(
                "host"
            )}/auth/confirm-email/${token}`;

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
        const io = getIO();
        try {
            const { token } = req.params;
            if (!token) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "Invalid token",
                    message: null,
                });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "Invalid token",
                    message: null,
                });
            }

            const user = await prisma.user.findUnique({
                where: { email: decoded.email },
            });

            if (!user) {
                return res.render("confitm-email", {
                    title: "Confirm Email",
                    error: "User not found",
                    message: null,
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
                message: null,
            });
        }
    }

    static async loginPage(req, res) {
        if (req.cookies && req.cookies.access_token) {
            console.log(req.cookies);
            return res.redirect("/auth/dashboard");
        }
        res.render("login", {
            title: "Sign in",
            error: null,
        });
    }

    static async login(req, res) {
        const io = getIO();
        try {
            const { email, password } = req.body;
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user && !(await bcrypt.compare(password, user.password))) {
                io.emit("loginError", "Email atau Password salah!");
                res.render("login", {
                    title: "Sign in",
                    error: "Email atau Password salah!",
                });
            }
            const isConfirmed = user.confirmed;
            if (!isConfirmed) {
                io.emit("loginError", "Email belum dikonfirmasi");
                return res.render("login", {
                    title: "Sign in",
                    error: "Email belum dikonfirmasi",
                });
            }
            const token = jwt.sign({ id: user.id }, JWT_SECRET, {
                expiresIn: "1h",
            });
            res.cookie("access_token", token, {
                httpOnly: true,
                secure: false,
            });
            return res.redirect("/auth/dashboard");
        } catch (error) {
            res.status(400).json({ error: "Error logging in" });
        }
    }

    static async dashboard(req, res) {
        res.render("dashboard", { title: "Dashboard" });
    }

    static async logout(req, res) {
        const io = getIO();
        res.clearCookie("access_token", {
            httpOnly: true,
        });

        io.emit("userLoggedOut", "User  has logged out.");

        res.redirect("/auth/login");
    }

    static async forgotPasswordPage(req, res) {
        res.render("forgot-password", { title: "Forgot Password" });
    }

    static async forgotPassword(req, res) {
        const io = getIO();
        try {
            const { email } = req.body;
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });
            if (!existingUser) {
                io.emit("forgotPassError", "Email belum terdaftar");
                res.render("forgot-password", { title: "Forgot Password" });
            }
            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
            const resetLink = `http://${req.get(
                "host"
            )}/auth/reset-password/${token}`;
            await sendEmail(
                email,
                "Reset Password",
                `Click here: ${resetLink}`
            );
            io.emit("resetLinkSent", "Reset link telah dikirim ke email anda");
            res.redirect("/auth/login");
        } catch (error) {
            console.log(error);
            io.emit("forgotPassError", "Terjadi kesalahan pada server");
            res.render("forgot-password", { title: "Forgot Password}" });
        }
    }

    static async resetPasswordPage(req, res) {
        const io = getIO();
        const { token } = req.params;
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded) {
                return res.render("reset-password", {
                    title: "Reset Password",
                    error: "Invalid token",
                    token, 
                });
            }
            res.render("reset-password", {
                title: "Reset Password",
                error: null,
                token, 
            });
        } catch (error) {
            console.log(error);
            res.render("reset-password", {
                title: "Reset Password",
                error: "Invalid token",
                token, 
            });
        }
    }
    
    static async resetPassword(req, res) {
        const io = getIO();
        const { token } = req.params;
        const { password, confirmPassword } = req.body;
    
        if (password !== confirmPassword) {
            io .emit(
                "resetPasswordError",
                "Password dan konfirmasi password tidak cocok."
            );
            return res.render("reset-password", {
                title: "Reset Password",
                error: "Password dan konfirmasi password tidak cocok.",
                token, 
            });
        }
    
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded) {
                io.emit("resetPasswordError", "Invalid token");
                return res.render("reset-password", {
                    title: "Reset Password",
                    error: "Invalid token",
                    token, 
                });
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email: decoded.email },
                data: { password: hashedPassword },
            });
    
            io.emit("resetPasswordSuccess", "Password berhasil direset.");
            res.redirect("/auth/login");
        } catch (error) {
            console.log(error);
            io.emit("resetPasswordError", "Terjadi kesalahan pada server");
            res.render("reset-password", {
                title: "Reset Password",
                error: "Terjadi kesalahan pada server",
                token, 
            });
        }
    }
}

module.exports = AuthController;
