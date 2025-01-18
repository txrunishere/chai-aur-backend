const { Router } = require("express");
const { registerUser } = require("../controllers/user.js");
const upload = require("../middlewares/multer.middleware.js");

const router = Router();

router.route("/register").post(
  upload.fields([ // a middleware to upload file images on this route
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

module.exports = router;
