import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookies or Authorization header
        let token = req.cookies?.accessToken || req.header("Authorization");

        // Log the extracted token to debug token reception
        // // console.log("Extracted Token from Cookies: ", req.cookies?.accessToken);
        // // console.log("Extracted Token from Headers: ", req.header("Authorization"));

        // If token is from Authorization header, remove the 'Bearer ' prefix
        if (typeof token === "string" && token.startsWith("Bearer ")) {
            token = token.replace("Bearer ", "").trim();
        }

        // Log the final token to debug its value
        // console.log("Final Token: ", token);

        // Check if token is valid
        if (!token || typeof token !== "string") {
            throw new ApiError(401, "Unauthorized request: Token is missing or invalid");
        }

        // Verify JWT and decode the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log("Decoded Token: ", decodedToken);

        // Find the user in the database using decoded token ID
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        // Check if user exists in the database
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach user to request object for further use
        req.user = user;

        // Proceed to the next middleware
        next();
    } catch (error) {
        // console.error("Error during JWT verification:", error);
        // Handle specific JWT verification errors (e.g., token expired)
        throw new ApiError(401, error.message || "Invalid access token");
    }
});
