import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// Function for adding a product
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestseller, stock } = req.body

    const image1 = req.files.image1 && req.files.image1[0]
    const image2 = req.files.image2 && req.files.image2[0]
    const image3 = req.files.image3 && req.files.image3[0]
    const image4 = req.files.image4 && req.files.image4[0]

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" })
        return result.secure_url
      }),
    )

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      stock: Number(stock),
      image: imagesUrl,
      date: Date.now(),
    }

    console.log(productData)

    const product = new productModel(productData)
    await product.save()

    res.json({ success: true, message: "Product Added" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Function for listing products
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({})
    res.json({ success: true, products })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Function for removing a product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id)
    res.json({ success: true, message: "Product Removed" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Function for getting single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body
    const product = await productModel.findById(productId)
    res.json({ success: true, product })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Function for updating product stock
const updateProductStock = async (req, res) => {
  try {
    const { productId, stock } = req.body

    const updatedProduct = await productModel.findByIdAndUpdate(productId, { stock: Number(stock) }, { new: true })

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    res.json({ success: true, message: "Product stock updated", product: updatedProduct })
  } catch (error) {
    console.error("Update stock error:", error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Function for updating a product
const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, category, subCategory, sizes, bestseller, stock } = req.body

    const updateData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      stock: Number(stock),
    }

    if (req.files) {
      const image1 = req.files.image1 && req.files.image1[0]
      const image2 = req.files.image2 && req.files.image2[0]
      const image3 = req.files.image3 && req.files.image3[0]
      const image4 = req.files.image4 && req.files.image4[0]

      const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" })
          return result.secure_url
        }),
      )

      updateData.image = imagesUrl
    }

    await productModel.findByIdAndUpdate(id, updateData)

    res.json({ success: true, message: "Product Updated" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { listProducts, addProduct, removeProduct, singleProduct, updateProductStock, updateProduct }