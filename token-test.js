require("dotenv").config();
const axios = require("axios");

async function getToken() {
  try {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
    });

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/oauth/access_token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log(response.data);
  } catch (err) {
    console.log(
      err.response ? err.response.data : err.message
    );
  }
}

getToken();