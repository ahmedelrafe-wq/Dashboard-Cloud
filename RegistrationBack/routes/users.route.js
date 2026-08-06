const { getAllUsers, createUser, getOneUser, updateUser, deleteUser, softDeletedUser } = require("../controllers/users.controller")
const authMiddleware = require("../middlewares/auth")
const restrictTo = require("../middlewares/restrictTo")

const router = require("express").Router()


router.route("/").get(authMiddleware,getAllUsers).post(createUser)

router .route("/soft-deleted/:id").patch(authMiddleware,softDeletedUser)

router.route("/:id").get(authMiddleware,getOneUser).patch(authMiddleware,updateUser).delete(authMiddleware,deleteUser)






module.exports = router