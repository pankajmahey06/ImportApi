const express = require('express');
const bodyParser = require('body-parser');
const importRoutes = require('./routes/importRoutes');

const app = express();

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Use the importContainerRoutes
app.use('/import', importRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
