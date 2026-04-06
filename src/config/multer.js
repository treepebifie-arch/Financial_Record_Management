const multer = require ('multer');
const path = require ('path');

//Multer config for Images and Videos
const storage = multer.diskStorage ({
    filefilter: (req, file, cb) => {
        const allowedExtensions = ['.jpeg', '.png', '.mp4', '.mov', '.avi', '.pdf', '.docx'];

        let ext = path.extname (file.originalname);

        //Check if the file extension is allowed
        if (allowedExtensions.includes(ext.toLowerCase())) {
            cb (null, true);
        } else {
            cb (new Error('Unsupported file type'), false);
        };
    },
});

const upload = multer ({storage});


module.exports = upload;