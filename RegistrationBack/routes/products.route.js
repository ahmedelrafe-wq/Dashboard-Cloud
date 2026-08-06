const { getAllProducts, createProduct, getDeletedProducts, getStates, getOneProduct, updateProduct, deleteProduct, softDeletedProduct } = require("../controllers/products.controller")

const router = require("express").Router()


router.route("/").get(getAllProducts).post(createProduct)

//must static come first, Bec. first match first out
router.route("/deleted-products").get(getDeletedProducts)
router.route("/get-states").get(getStates)
router.route("/soft-deleted/:id").patch(softDeletedProduct)
router.route("/:id").get(getOneProduct).patch(updateProduct).delete(deleteProduct)


module.exports = router