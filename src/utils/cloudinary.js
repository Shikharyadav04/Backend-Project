import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
    api_key: process.env.CLOUDNARY_API_KEY, 
    api_secret: process.env.CLOUDNARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadonCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null 
        //upload file on cloadinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        //file has been uplaoded
        //console.log("file has been uplaoded sucessfully !!",response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);  // Delete the file only if it exists
            //console.log('Temporary file deleted successfully.');
        }
        return response ;
        
    } catch (error) {
        fs.unlinkSync(localFilePath)   // remove the laoclly saved temporary file as the uplaod operation got failed
        return null ;
    }
}



export {uploadonCloudinary}