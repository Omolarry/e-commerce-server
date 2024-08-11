const productModel = require("../models/productsModel");
const categoryModel = require("../models/categoriesModel");
const fs = require("fs");
const path = require("path");

class Product {
  // Delete Image from uploads -> products folder
  static deleteImages(images, mode) {
    var basePath =
      path.resolve(__dirname + "../../") + "/public/uploads/products/";
    console.log(basePath);
    for (var i = 0; i < images.length; i++) {
      let filePath = "";
      if (mode == "file") {
        filePath = basePath + `${images[i].filename}`;
      } else {
        filePath = basePath + `${images[i]}`;
      }
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        console.log("Image Exists");
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          return err;
        }
      });
    }
  }

  async getAllProduct(req, res) {
    try {
      let Products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 });
      if (Products) {
        return res.json({ Products });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getAllProducts(req, res) {
    try {
      let filter = {};
      let sort = { _id: -1 }; // Default sort order

      // Log the received query parameters
      console.log("Received query parameters:", req.query);

      if (req.query.category) {
        // Fetch the category by name to get its ObjectId
        const category = await categoryModel.findOne({ cName: req.query.category }).select('_id');

        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }

        filter.pCategory = category._id;
      }

      if (req.query.sortBy) {
        sort = { [req.query.sortBy]: -1 }; // Sort by the specified field in descending order
      }

      // Log the constructed filter and sort objects
      console.log("Filter:", filter);
      console.log("Sort:", sort);

      let Products = await productModel
        .find(filter)
        .populate("pCategory", "_id cName")
        .sort(sort);

      if (Products.length > 0) {
        return res.json({ result: Products.length, Products });
      } else {
        return res.status(404).json({ error: "No products found" });
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "An error occurred while fetching products" });
    }
  }

  async postAddProduct(req, res) {
    let { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } =
      req.body;
    let images = req.files;
    // Validation
    if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pOffer || !pStatus) {
      Product.deleteImages(images, "file");
      return res.json({ error: "All fields required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      Product.deleteImages(images, "file");
      return res.json({
        error: "Name must not exceed 255 characters & Description must not be more than 3000 characters long",
      });
    }
    // Validate Images
    else if (images.length !== 2) {
      Product.deleteImages(images, "file");
      return res.json({ error: "Must provide 2 images" });
    } else {
      try {
        let allImages = [];
        for (const img of images) {
          allImages.push(img.filename);
        }
        let newProduct = new productModel({
          pImages: allImages,
          pName,
          pDescription,
          pPrice,
          pQuantity,
          pCategory,
          pOffer,
          pStatus,
        });
        let save = await newProduct.save();
        if (save) {
          return res.json({ success: "Product created successfully" });
        }
      } catch (err) {
        console.log(err);
        return res.json({ error: "Error adding product." });
      }
    }
  }

  async postEditProduct(req, res) {
    let { pId, pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus, pImages } = req.body;
    let editImages = req.files;
    let checkProduct = await productModel.findById(pId);
    if (!checkProduct) {
      return res.json({ error: "Product not found" });
    }

    // Validate other fileds
    if (!pId || !pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pOffer || !pStatus) {
      return res.json({ error: "All fields required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: "Name must not exceed 255 characters & Description must not be more than 3000 characters long",
      });
    }
    // Validate Update Images
    else if (editImages && editImages.length !== 2) {
      Product.deleteImages(editImages, "file");
      return res.json({ error: "Must provide 2 images" });
    } else {
      let editData = { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus };
      if (editImages.length == 2) {
        let allEditImages = [];
        for (const img of editImages) {
          allEditImages.push(img.filename);
        }
        editData = { ...editData, pImages: allEditImages };
        Product.deleteImages(pImages.split(","), "string");
      }
      try {
        let editProduct = productModel.findByIdAndUpdate(pId, editData);
        editProduct.exec((err) => {
          if (err) console.log(err);
          return res.json({ success: "Product edited successfully" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "Field required" });
    } else {
      let checkProduct = await productModel.findById(pId);
      if (!checkProduct) {
        return res.json({ error: "Product not found" });
      }
      try {
        let deleteProductObj = await productModel.findById(pId);
        let deleteProduct = await productModel.findByIdAndDelete(pId);
        if (deleteProduct) {
          // Delete Image from uploads -> products folder
          Product.deleteImages(deleteProductObj.pImages, "string");
          return res.json({ success: "Product deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProductId(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let singleProduct = await productModel
          .findById(pId)
          .populate("pCategory", "cName")
          .populate("pRatingsReviews.user", "name email userImage");
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProductName(req, res) {
    let { pName } = req.body;
    if (!pName) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let singleProduct = await productModel
          .findOne({ pName })
          .populate("pCategory", "cName")
          .populate("pRatingsReviews.user", "name email userImage");
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        } else {
          return res.json({ error: "Product not found" });
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "An error occurred while fetching the product" });
      }
    }
  }


  async getProductByCategory(req, res) {
    let { catId } = req.body;
    if (!catId) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let products = await productModel
          .find({ pCategory: catId })
          .populate("pCategory", "cName");
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Error searching product. Please try again or contact admin" });
      }
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    if (!price) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let products = await productModel
          .find({ pPrice: { $lt: price } })
          .populate("pCategory", "cName")
          .sort({ pPrice: -1 });
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Error filtering product. Please try again or contact admin" });
      }
    }
  }

  async getProductByPopularity(req, res) {
    let { limit } = req.body;
    if (!limit) {
      return res.json({ error: "Limit is required" });
    } else {
      try {
        let products = await productModel
          .find({})
          .populate("pCategory", "cName")
          .sort({ pSold: -1 }) // Sorting by pSold in descending order
          .limit(parseInt(limit)); // Limit the number of results
        if (products.length > 0) {
          return res.json({ result: products.length, Products: products });
        } else {
          return res.json({ message: "No products found" });
        }
      } catch (err) {
        console.log(err);
        return res.json({ error: "Error fetching popular products. Please try again or contact admin" });
      }
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let wishProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (wishProducts) {
          return res.json({ Products: wishProducts });
        }
      } catch (err) {
        return res.json({ error: "Error finding product. Please try again or contact admin" });
      }
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let cartProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (cartProducts) {
          return res.json({ Products: cartProducts });
        }
      } catch (err) {
        return res.json({ error: "Error getting product. Please try again or contact admin" });
      }
    }
  }

  async postAddReview(req, res) {
    let { pId, uId, rating, review } = req.body;
    if (!pId || !rating || !review || !uId) {
      return res.json({ error: "All fields required" });
    } else {
      let checkReviewRatingExists = await productModel.findOne({ _id: pId });
      if (checkReviewRatingExists.pRatingsReviews.length > 0) {
        checkReviewRatingExists.pRatingsReviews.map((item) => {
          if (item.user === uId) {
            return res.json({ error: "You have already submitted a review." });
          } else {
            try {
              let newRatingReview = productModel.findByIdAndUpdate(pId, {
                $push: {
                  pRatingsReviews: {
                    review: review,
                    user: uId,
                    rating: rating,
                  },
                },
              });
              newRatingReview.exec((err, result) => {
                if (err) {
                  console.log(err);
                }
                return res.json({ success: "Thanks for your review" });
              });
            } catch (err) {
              return res.json({ error: "Error carting product. Please try again or contact admin" });
            }
          }
        });
      } else {
        try {
          let newRatingReview = productModel.findByIdAndUpdate(pId, {
            $push: {
              pRatingsReviews: { review: review, user: uId, rating: rating },
            },
          });
          newRatingReview.exec((err, result) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Thanks for your review" });
          });
        } catch (err) {
          return res.json({ error: "Error carting product. Please try again or contact admin" });
        }
      }
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    if (!rId) {
      return res.json({ message: "All fields required" });
    } else {
      try {
        let reviewDelete = productModel.findByIdAndUpdate(pId, {
          $pull: { pRatingsReviews: { _id: rId } },
        });
        reviewDelete.exec((err, result) => {
          if (err) {
            console.log(err);
          }
          return res.json({ success: "Your review has been deleted" });
        });
      } catch (err) {
        console.log(err);
        return res.json({ error: "Couldn't delete review. Please try again or contact admin" });
      }
    }
  }
}

const productController = new Product();
module.exports = productController;
