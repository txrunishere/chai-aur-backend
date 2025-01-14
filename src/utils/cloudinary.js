const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload a file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded
    console.log("File is Uploaded Successfully!!", res.url);
    return res;
  } catch (error) {
    fs.unlink(localFilePath); // remove the locally save temp file as the upload operation was failed
    return null;
  }
};

module.exports = { uploadOnCloudinary };


// cloudinary.uploader.upload(
//   "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//   {
//     public_id: "shoes",
//   },
//   (err, res) => {
//     console.log(res);
//   }
// );
