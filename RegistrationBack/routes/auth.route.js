const { signUp, confirmEmail, login, forgetPassword, resetPassword } = require("../controllers/auth.controller")

const router = require("express").Router()


router.route("/sign-up").post(signUp)
router.route("/login").post(login)
router.route("/confirm-email").post(confirmEmail)
router.route("/forget-password").post(forgetPassword)
router.route("/reset-password/:token").post(resetPassword)


module.exports = router