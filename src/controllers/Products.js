const hs = require("http-status");
const { checkSecureFile } = require("../scripts/utils/helper");
const path = require("path");
const ProductService = require("../services/ProductService");
const ApiError = require("../errors/ApiError");
class ProductController {
  index(req, res, next) {
    ProductService.list()
      .then((itemList) => {
        if (!itemList) return next(new ApiError("Products are not fetched", hs.NOT_FOUND));
        res.status(hs.OK).send(itemList);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  create(req, res, next) {
    req.body.user_id = req.user;
    ProductService.create(req.body)
      .then((createdDoc) => {
        if (!createdDoc) return next(new ApiError("Product is not created", hs.NOT_FOUND));
        res.status(hs.OK).send(createdDoc);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  update(req, res, next) {
    ProductService.update(req.params.id, req.body)
      .then((updatedDoc) => {
        if (!updatedDoc)  return next(new ApiError("This product is not found", hs.NOT_FOUND));
        res.status(hs.OK).send(updatedDoc);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  addComment(req, res, next) {
    ProductService.findOne({ _id: req.params.id }).then((mainProduct) => {
      if (!mainProduct) return next(new ApiError("This product is not found", hs.NOT_FOUND));
      const comment = {
        ...req.body,
        created_at: new Date(),
        user_id: req.user,
      };
      mainProduct.comments.push(comment);
      ProductService.update(req.params.id, mainProduct)
        .then((updatedDoc) => {
          if (!updatedDoc) return next(new ApiError("This product is not found", hs.NOT_FOUND));
          res.status(hs.OK).send(updatedDoc);
        })
        .catch((e) => next(new ApiError(e?.message)));
    });
  }
  addMedia(req, res, next) {
    if (!req.files?.file || !checkSecureFile(req?.files?.file?.mimetype)) return next(new ApiError("Bad request", hs.BAD_REQUEST));
    ProductService.findOne({ _id: req.params.id }).then((mainProduct) => {
      if (!mainProduct) return next(new ApiError("This product is not found", hs.NOT_FOUND));

      const extension = path.extname(req.files.file.name);
      const fileName = `${mainProduct._id?.toString()}${extension}`;
      const folderPath = path.join(__dirname, "../", "uploads/products", fileName);

      req.files.file.mv(folderPath, function (err) {
        if (err) next(new ApiError(e?.message))
        mainProduct.media = fileName;
        ProductService.update(req.params.id, mainProduct)
          .then((updatedDoc) => {
            if (!updatedDoc)  return next(new ApiError("This product is not found", hs.NOT_FOUND));
            res.status(hs.OK).send(updatedDoc);
          })
          .catch((e) => next(new ApiError(e?.message)));
      });
    });
  }
}

module.exports = new ProductController();
