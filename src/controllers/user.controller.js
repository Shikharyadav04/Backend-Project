import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadonCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

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
    console.log("email" , email) ;

    if( [fullName , email , username , password].some((field) => field?.trim() === "")) {
        throw new ApiError(400,"All fields are required !!")
    }

    const existedUser =  User.findOne({
        $or : [{ username } , { email }]
    })
    
    if(existedUser){
        throw new ApiError(409,"User already in DB")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file is required")
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

export {registerUser}
