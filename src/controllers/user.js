const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");
const User = require("../models/user.model.js"); // we import it here because it directly connect with the mongoose / mongoDB
const jwt = require("jsonwebtoken");

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

// method for generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "refresh and access token are not generated!!");
  }
};

// Register user
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

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  )
    coverImageLocalPath = req.files.coverImage[0].path;

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

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // if (!(username || email))
  // if (!username && !email)
  if (!username && !email)
    throw new ApiError(400, "Email or Username is required!!");

  const checkUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!checkUser) throw new ApiError(404, "User not Exists");

  const checkPasswordValidation = await checkUser.isPasswordCorrect(password);
  if (!checkPasswordValidation) throw new ApiError(401, "Invalid Password!!");

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    checkUser._id
  );

  const checkLoggedInUser = await User.findById(checkUser._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: checkLoggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in"
      )
    );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logout"));
});

// refresh and change access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token!!");

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!!");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refresh successfully!!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Change user password
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid password!!");

  user.password = newPassword;
  user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully!!"));
});

// Get data of current user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetch successfully!!"));
});





module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccDetails,
};
