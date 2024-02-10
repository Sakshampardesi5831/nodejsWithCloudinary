
const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const fs = require('fs');
const app = express();
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

const imagePath = './images/IMG_20210326_131817.jpg';

app.use(express.static('upload'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Multer diskStorage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

//using a library called multer-storage-cloudinary to upload images to cloudinary.
const storage1 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "DEV",
  },
});
function uploadToCloudinaryAndDelete(file) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.path, { folder: 'samples' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        // Delete the file from disk
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log('File deleted successfully');
          }
        });
        resolve(result.url);
      }
    });
  });
}
const upload = multer({ storage: storage });
const upload1 = multer({ storage: storage1 });



//create a folder samples in media explorer inside cloudinary 
app.get('/', (req, res) => {
    cloudinary.uploader.upload(imagePath, { folder: 'samples' }, (error, result) => {
        if (error) {
          console.error('Error uploading image:', error);
        } else {
          console.log('Image uploaded successfully:', result.url);
        }
      });
    res.send('Hello, Express!');
});
//this route using the cloudinary storage library 
app.post('/upload', upload1.single('file'), (req, res) => {
  // Upload image to Cloudinary
  console.log(req.file);
  cloudinary.uploader.upload(req.file.path, { folder: 'samples' }, (error, result) => {
    if (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Error uploading image' });
    } else {
      console.log('Image uploaded successfully:', result.url);
      // Delete the file from disk
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });
      res.status(200).json({ url: result.url });
    }
  });
});

//and this routes using multer fields with optimize way 

app.post("/upload2",upload.fields([{ name: 'file1' }, { name: 'file2' }]),async (req,res,next)=>{
  const uploads = [];
  const files = req.files;
  const keys = Object.keys(files);

  keys.forEach((key) => {
    const file = files[key][0];
    uploads.push(uploadToCloudinaryAndDelete(file));
  });
  try {
    const urls = await Promise.all(uploads);
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Error uploading images' });
  }
})


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
