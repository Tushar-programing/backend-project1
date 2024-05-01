import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
// import { JsonWebTokenError } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import sendWelcomeEmail from "./email.controller.js";
import cryptoRandomString from 'crypto-random-string';



console.log("its working 2")

const generateAccessAndRefreshTokens = async(userid) => {
    try {
        // console.log( "userid in", userid);
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        // console.log("tokens", accessToken);
        // console.log("tokens in", refreshToken);

        return {accessToken, refreshToken}
    } catch (error) {
        
    }
}

const register = asyncHandler(async(req, res) => {
    // console.log("register is working")
    const {userName, email, password} = req.body;

    console.log(userName, email, password);

    if (!userName || !email || !password) {
        throw new ApiError(400, "all Fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]  
    })

    if (existedUser) {
        throw new ApiError(400, "User already exist with this email or userName")
    }

    const user =  await User.create({
        userName,
        email,
        password
    })

    if (!user) {
        throw new ApiError(400, "unable to create user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "succesfully created the user"))

})

const login = asyncHandler(async(req, res) => {
    console.log("login is working");
    const {email, password, userName} = req.body;

    console.log(email, password, userName);

    if (!password) {
        throw new ApiError(400, "passowrd is required")
    }

    if (!email  && !userName) {
        throw new ApiError(400, "email or userName is required")
    }
    // console.log("1");
    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })
    // console.log("2.1");
    if (!user) {
        throw new ApiError(400, "user does not exist")
    }
    // console.log("3");
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    // console.log("4");
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect Password");
    }
    // console.log("4");
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // console.log("5");
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    // console.log("5.1");
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    }
    // console.log("6");
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in succesfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.userId,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully"))
})

const forgotPassword = asyncHandler(async(req, res) => {
    console.log("forgot mail");
    const {email, userName} = req.body;

    if (!email && !userName) {
        throw new ApiError(400, "email or userName  is required")
    }

    const userData = await User.findOne({
        $or: [{ email }, { userName }],
    })

    const token = cryptoRandomString({ length: 30 });

    const data = await User.findByIdAndUpdate(
        userData._id,
        {
            $set: {
                token,
            }
        },
        {new: true}
    )
    if (!data) {
        throw new ApiError(400, "no user find with this email or userName")
    }

    if (data) {
        sendWelcomeEmail(userData.email, token)
        console.log(userData.email, token);
    }
    
    return res
    .status(201)
    .json(new ApiResponse(201, data, "forgot password link sent to your mail. please check your e-mail"));
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {token} = req.query;
    const {newPassword} = req.body;
    
    if (!token || !newPassword) {
        throw new ApiError(400, "no token find  in query params  or new password not provided");
    }
    
    const user = await User.findOne({token});

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, user, "password update successfully"))

})

export {
    register,
    login,
    logoutUser,
    forgotPassword,
    changeCurrentPassword,
}