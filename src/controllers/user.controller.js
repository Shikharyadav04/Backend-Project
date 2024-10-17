import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadonCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from 'mongoose';

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId) ;
        const accessToken =  user.generateAccessToken() ;
        const refreshToken = user.generateRefreshToken() ;
        
        user.refreshToken = refreshToken ;
        await user.save({validateBeforeSave : false})
        
        
        
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh tokens")
    }
}


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



const loginUser = asyncHandler(async (req, res) => {
    // Extract login data from the request body
    const { email, username, password } = req.body;

    // Check if either username or email is provided
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // Find the user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // Check if the user exists
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Validate the password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Password is incorrect");
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    console.log("Access Token:", accessToken);

    // Retrieve the logged-in user data without password and refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Cookie options
    const cookieOptions = {
        httpOnly: true, // Prevents client-side access to cookies (security)
        secure: true, // Only send over HTTPS in production
        sameSite: 'Strict', // Prevents CSRF (strict mode)
        maxAge: 24 * 60 * 60 * 1000 // Cookie expires in 1 day
    };

    // Set cookies for accessToken and refreshToken
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // Send response back to the client
    // Set the cookies in the response
return res
.status(200)
.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Ensure this is set based on your environment
    sameSite: 'None', // Use None if making cross-origin requests
    path: '/', // Specify the path
})
.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    path: '/',
})
.json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken, // Optionally include in the response
            refreshToken, // Optionally include in the response
        },
        "user logged in successfully"
    )
);

});


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
