import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the upload directory exists, if not, create it
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage engine: tell multer where to store files and how to name them
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Store in the uploads/ folder
    },
    filename: (req, file, cb) => {
        // To prevent overwriting files with the same name, add a timestamp to the filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Strict format whitelist
const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
    '.txt', '.hwp', '.hwpx', '.csv', '.jpg', '.jpeg', '.png', 
    '.gif', '.bmp', '.webp'
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Extract the file extension and convert to lowercase
    const ext = path.extname(file.originalname).toLowerCase();
    

    // Strictly block SVG and other disallowed file types
    if (allowedExtensions.includes(ext) && file.mimetype !== 'image/svg+xml') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error(`File type ${ext} is not allowed by Nupjuk Campus policies.`)); // Reject the file
    }
};

// Export the configured multer middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // Limit file size to 15MB
    }
});