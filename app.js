const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route to serve the admin page
app.get('/admin', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');

    // Get all device folders
    fs.readdir(uploadsDir, (err, devices) => {
        if (err) {
            return res.status(500).send('Error reading uploads directory');
        }

        // Collect all images from each device folder
        const imagesByDevice = devices.map(deviceId => {
            const deviceFolder = path.join(uploadsDir, deviceId);
            const images = fs.readdirSync(deviceFolder).map(image => ({
                filename: image,
                path: `/uploads/${deviceId}/${image}`,
                deviceId,
            }));

            return { deviceId, images };
        });

        res.render('admin', { imagesByDevice });
    });
});

// Route to delete an image
app.delete('/delete-image/:deviceId/:image', (req, res) => {
    const { deviceId, image } = req.params;
    const filePath = path.join(__dirname, 'uploads', deviceId, image);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Error deleting image');
        }
        res.send('Image deleted successfully');
    });
});

// DELETE route to delete a device folder
app.delete('/delete-device/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    const folderPath = path.join(__dirname, 'uploads', deviceId); // Assuming 'uploads' is your base folder for devices

    // Check if the folder exists
    if (fs.existsSync(folderPath)) {
        // Recursively delete the folder and its contents
        fs.rm(folderPath, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Error deleting folder:', err);
                return res.status(500).send('Could not delete the device folder.');
            }

            res.send('Device folder deleted successfully.');
        });
    } else {
        res.status(404).send('Device folder not found.');
    }
});

// Route to handle the image upload
app.post('/upload-image', (req, res) => {
    const { deviceId, image } = req.body;


    // Create a directory for the device if it doesn't exist
    const deviceFolder = path.join(__dirname, 'uploads', deviceId);
    if (!fs.existsSync(deviceFolder)) {
        fs.mkdirSync(deviceFolder, { recursive: true });
    }


    // Remove the data URL prefix to get the base64 string
    const base64Data = image.replace(/^data:image\/png;base64,/, '');

    // Generate a unique filename
    const fileName = `image_${Date.now()}.png`;
    const filePath = path.join(deviceFolder, fileName);

    // Save the image to the uploads folder
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return res.status(500).send('Failed to save image');
        }
        console.log(`Image saved: ${filePath}`);
        res.send('Image uploaded successfully');
    });
});

// Serve the EJS file
app.get('/', (req, res) => {
    res.render('index');  // Assuming the EJS file is named 'index.ejs'
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create an uploads directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Create an uploads directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
