import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadonCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from 'mongoose'
const registerUser = asyncHandler(async (req,res) => {
    //get user data  from frontend
    //check for validation 
    //check if user already exist or not : username and email
    //check for avtar and images 
    //uplaod them on cloudnary 
    //create user object - create entry in db
    //remove password and refresh token field form response 
    //check for user creation 
    //return res

    const {fullName , email , username , password} = req.body
    //console.log("email" , email) ;

    if( [fullName , email , username , password].some((field) => field?.trim() === "")) {
        throw new ApiError(400,"All fields are required !!")
    }

    const existedUser =  await User.findOne({
        $or : [{ username } , { email }]
    })
    
    if(existedUser){
        throw new ApiError(409,"User already in DB")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase() ,
        
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user Registered sucessfully")
    )



})

const generateAcessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId) ;
        const acessToken =  user.generateAcessToken() ;
        const refreshToken = user.generateRefreshToken() ;
        
        user.refreshToken = refreshToken ;
        await user.save({validateBeforeSave : false})
        
        
        
        return {acessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh tokens")
    }
}

const loginUser = asyncHandler(async (req,res) => {
    // req body => data 
    //username or email validate 
    // find user
    //password check
    //generate refresh and acess token
    //send cookie

    const {email,username,fullName,password} = req.body


    if(!username || !email ){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or : [{username} , {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        return new ApiError(404,"password is incorrect")
    }

    const {acessToken,refreshToken} = await generateAcessAndRefreshTokens(user._id)


    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",options)
    .cookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken,refreshToken
            },
            "user logged in sucessfully"

        )
     )  




})


const logoutUser = asyncHandler(async (req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user LoggedOut"))

})

export {
    registerUser,
    loginUser,
    logoutUser
}
