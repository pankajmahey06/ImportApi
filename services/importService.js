const express = require("express");
const axios = require("axios");
const fs = require("fs");
const https = require("https");
const csvParser = require("csv-parser");


const app = express();

// Create an HTTPS agent to bypass SSL verification
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Function to create an import container
const createImportContainer = async (region, projectKey, importContainerDraft) => {
  const url = `https://import.${region}.commercetools.com/${projectKey}/import-containers`;

  try {
    const response = await axios.post(url, importContainerDraft, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 6_YTLeZsDrsVArIcPlS1CdUvo57wyO1G",
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};

// Function to create import categories by posting JSON data
const createImportCategories = async (data, csvFile, token) => {
  const { region, projectKey, importContainerKey } = data;
  const url = `https://import.${region}.commercetools.com/${projectKey}/categories/import-containers/${importContainerKey}`;

  const jsonData = await parseCSVToJSON(csvFile.path);

  const postData = {
    type: "category",
    resources: jsonData,
  };

  try {
    const response = await axios.post(url, postData, {
      httpsAgent: agent,
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Error while posting data to Commercetools:", error);
    throw error;
  }
};

// Function to create import orders by posting JSON data
// const createImportOrders = async (data, csvFile, token) => {
//   const { region, projectKey, importContainerKey } = data;
//   const url = `https://import.${region}.commercetools.com/${projectKey}/orders/import-containers/${importContainerKey}`;

//   // Parse the CSV file to JSON
//   const jsonData = await orderParseCSVToJSON(csvFile.path);

//   // Set up HTTPS agent (if needed)
//   const agent = new https.Agent({
//     rejectUnauthorized: false, // Set to true if you need strict SSL certificate validation
//   });

//   const postData = {
//     type: "order",
//     resources: jsonData,
//   };

//   try {
//     // Send the POST request with the JSON data
//     const response = await axios.post(url, postData, {
//       httpsAgent: agent,
//       headers: {
//         Authorization: `${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     // Return the API response to the controller
//     return response;
//   } catch (error) {
//     // Handle errors and propagate them to the controller
//     console.error("Error while posting data to Commercetools:", error);
//     throw error;
//   }
// };

// Function to parse CSV file specifically for orders
// const orderParseCSVToJSON = (csvFilePath) => {
//   return new Promise((resolve, reject) => {
//     const results = [];

//     fs.createReadStream(csvFilePath)
//       .pipe(csvParser())
//       .on("data", (row) => {
//         const order = {
//           key: row.orderNumber, // Added key field
//           orderNumber: row.orderNumber,
//           customer: {
//             typeId: "customer",
//             key: row.customerId // Using customerId as the customer key
//           },
//           customerEmail: row.customerEmail,
//           totalPrice: {
//             type: "centPrecision", // Added type field
//             currencyCode: row.currencyCode || 'USD',
//             centAmount: Math.round(parseFloat(row.totalPrice) * 100)
//           },
//           lineItems: [{
//             variant: {
//               typeId: "product-variant",
//               key: `${row.productId}-${row.variantId}` // Combining product and variant IDs
//             },
//             name: {
//               en: row.productName
//             },
//             price: {
//               value: {
//                 type: "centPrecision",
//                 currencyCode: row.currencyCode || 'USD',
//                 centAmount: Math.round(parseFloat(row.itemPrice) * 100)
//               }
//             },
//             quantity: parseInt(row.quantity) || 1
//           }],
//           shippingAddress: {
//             firstName: row.shippingFirstName,
//             lastName: row.shippingLastName,
//             streetName: row.shippingStreet,
//             city: row.shippingCity,
//             postalCode: row.shippingPostalCode,
//             country: row.shippingCountry
//           },
//           billingAddress: {
//             firstName: row.billingFirstName || row.shippingFirstName,
//             lastName: row.billingLastName || row.shippingLastName,
//             streetName: row.billingStreet || row.shippingStreet,
//             city: row.billingCity || row.shippingCity,
//             postalCode: row.billingPostalCode || row.shippingPostalCode,
//             country: row.billingCountry || row.shippingCountry
//           },
//           orderState: row.orderState || 'Open',
//           paymentState: row.paymentState || 'Paid',
//           shipmentState: row.shipmentState || 'Shipped'
//         };

//         results.push(order);
//       })
//       .on("end", () => {
//         resolve(results);
//       })
//       .on("error", (error) => {
//         reject(error);
//       });
//   });
// };

// Function to parse a CSV file and convert it into a JSON array for categories
const parseCSVToJSON = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const nameObj = {};

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (data) => {
        const output = {
          key: data.key,
          externalId: data.externalId,
          name: {},
          slug: {},
          orderHint: data.orderHint,
        };
        
        Object.keys(data).forEach(key => {
          if (key.startsWith('name.')) {
            const lang = key.split('.')[1];
            output.name[lang] = data[key];
          } else if (key.startsWith('slug.')) {
            const lang = key.split('.')[1];
            output.slug[lang] = data[key];
          }
        });

        results.push(output);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

// Function to parse inventory CSV file and convert it into a JSON array
const inventoryParseCSVToJSON = (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (data) => {
        if (!data.key || !data.sku || !data.quantityOnStock) {
          console.log('Skipping row due to missing required fields:', data);
          return; 
        }

        const output = {
          key: data.key,
          sku: data.sku,
          quantityOnStock: parseInt(data.quantityOnStock, 10)
        };
        if (data.restockableInDays) {
          output.restockableInDays = parseInt(data.restockableInDays, 10);
        }
        
        if (data.expectedDelivery) {
          output.expectedDelivery = data.expectedDelivery;
        }
        
        if (data.supplyChannel) {
          output.supplyChannel = {
            typeId: "channel",
            key: data.supplyChannel
          };
        }

        results.push(output);
      })
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};


// Function to create import inventory entries
const createImportInventory = async (data, csvFile, token) => {
  const { region, projectKey, importContainerKey } = data;
  const url = `https://import.${region}.commercetools.com/${projectKey}/inventories/import-containers/${importContainerKey}`;

  // Parse the CSV file to JSON
  const jsonData = await inventoryParseCSVToJSON(csvFile.path);

  const postData = {
    type: "inventory",
    resources: jsonData,
  };
  console.log("PostData", postData);
  try {
    const response = await axios.post(url, postData, {
      httpsAgent: agent,
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("RESPONSE", response);

    return response;
  } catch (error) {
    console.error("Error while posting data to Commercetools:", error);
    throw error;
  }
};

// ... rest of your existing functions ...

module.exports = {
  createImportContainer,
  createImportCategories,
  createImportInventory,
  // createImportOrders,
};