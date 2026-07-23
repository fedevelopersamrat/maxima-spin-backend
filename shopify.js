require("dotenv").config();

const axios = require("axios");

const SHOP = process.env.SHOPIFY_STORE;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

console.log("Store:", SHOP);
console.log("Client ID:", CLIENT_ID);
console.log("Client Secret Loaded:", CLIENT_SECRET ? "YES" : "NO");