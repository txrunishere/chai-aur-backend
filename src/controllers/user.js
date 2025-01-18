const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");
const User = require("../models/user.model.js"); // we import it here because it directly connect with the mongoose / mongoDB

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;

  // check for  fields
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  )
    throw new ApiError(400, "field is required!!");

  // check the given email is correct or not
  if (!email.includes("@"))
    throw new ApiError(400, "must include '@' in given email address");

  // check for user is exist or not in database
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) throw new ApiError(409, "User already exists");

  // upload image on cloudinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) coverImageLocalPath = req.files.coverImage[0].path 

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required!!");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required!!");

  // Database Entry
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username,
  });

  // remove password or refresh token from response
  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!checkUser)
    throw new ApiError(500, "User not Register. Something went wrong!!");

  // finally return the response
  return res
    .status(201)
    .json(new ApiResponse(200, checkUser, "User registered successfully!!"));
});

module.exports = {
  registerUser,
};
