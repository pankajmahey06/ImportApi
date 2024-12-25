const importService = require('../services/importService');

const createImportContainer = async (req, res) => {
  const { region, projectKey, importContainerDraft } = req.body;

  try {
    const response = await importService.createImportContainer(region, projectKey, importContainerDraft);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create import container',
      error: error.response ? error.response.data : error.message,
    });
  }
};

const createImportCategories = async (req, res) => {
  const token = req.headers['authorization'];
  const { region, projectKey, importContainerKey } = req.body;
  const csvFile = req.file;

  if (!csvFile) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  try {
    const response = await importService.createImportCategories(
      { region, projectKey, importContainerKey },
      csvFile,
      token
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create import categories',
      error: error.response ? error.response.data : error.message,
    });
  }
};


const createImportInventory = async (req, res) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  const { region, projectKey, importContainerKey } = req.body;
  const csvFile = req.file;

  if (!csvFile) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  try {
    const response = await importService.createImportInventory(
      { 
        region: region || process.env.CTP_REGION,
        projectKey: projectKey || process.env.CTP_PROJECT_KEY,
        importContainerKey 
      },
      csvFile,
      token
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(error.response?.status || 500).json({
      message: 'Failed to import inventory',
      error: error.response?.data || error.message,
    });
  }
};

const createImportOrders = async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const { region, projectKey, importContainerKey } = req.body;
    const csvFile = req.file;

    if (!csvFile) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const response = await importService.createImportOrders(
      { region, projectKey, importContainerKey },
      csvFile,
      token
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error importing orders:', error);
    res.status(500).json({
      message: 'Failed to import orders',
      error: error.response ? error.response.data : error.message,
    });
  }
};
// ... rest of your existing controller functions ...

module.exports = {
  createImportContainer,
  createImportCategories,
  createImportInventory,
  createImportOrders,
};