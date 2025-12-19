const express = require("express");
const router = express.Router();
const blogController = require("../../controller/client/blog.controller");

// Blog page route
router.get("/", blogController.index);

// New SEO articles
router.get("/bai-1", blogController.articleOne);
router.get("/bai-2", blogController.articleTwo);
router.get("/bai-3", blogController.articleThree);
router.get("/bai-4", blogController.articleFour);
router.get("/bai-5", blogController.articleFive);
router.get("/bai-6", blogController.articleSix);
router.get("/bai-7", blogController.articleSeven);
router.get("/bai-8", blogController.articleEight);
router.get("/bai-9", blogController.articleNine);
router.get("/bai-10", blogController.articleTen);
router.get("/bai-11", blogController.articleEleven);

module.exports = router;
