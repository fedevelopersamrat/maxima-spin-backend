const SHOPIFY_SHOP_DOMAIN =
  process.env.SHOPIFY_SHOP_DOMAIN || process.env.SHOPIFY_STORE;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = '2026-07';

let cachedAccessToken = null;
let tokenExpiryTime = 0;

/**
 * Gets a valid Admin Access Token using Client Credentials
 */
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && tokenExpiryTime > now + 60) {
    return cachedAccessToken;
  }

  const tokenUrl = `https://${SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`;
  console.log("Shop Domain:", SHOPIFY_SHOP_DOMAIN);
  console.log("Token URL:", tokenUrl);
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", SHOPIFY_CLIENT_ID);
  params.append("client_secret", SHOPIFY_CLIENT_SECRET);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Shopify Access Token: ${errorText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiryTime = now + (data.expires_in || 86399);
  return cachedAccessToken;
}

/**
 * Generates a random uppercase coupon code (e.g. AB123)
 */
function generateCouponCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
}

/**
 * Creates a 10% Discount Code on Shopify using GraphQL API
 */
async function createShopifyCoupon() {
  const token = await getAccessToken();
  console.log("Access Token:", token);
  const couponCode = generateCouponCode();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);

  const graphqlQuery = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              status
              codes(first: 1) {
                nodes {
                  code
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    basicCodeDiscount: {
      title: `Spin Wheel ${couponCode}`,
      code: couponCode,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      usageLimit: 1,
      appliesOncePerCustomer: true,
      
      context: {
        all: "ALL"
      },
      
      customerGets: {
        value: {
          percentage: 0.10
        },
        items: {
          all: true
        }
      },
      
      minimumRequirement: {
        subtotal: {
          greaterThanOrEqualToSubtotal: "999.00"
        }
      }
    }
  };

  const graphqlEndpoint = `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL API Request Failed: ${errorText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(result.errors)}`);
  }

  const data = result.data?.discountCodeBasicCreate;
  if (data?.userErrors && data.userErrors.length > 0) {
    throw new Error(`Shopify User Errors: ${JSON.stringify(data.userErrors)}`);
  }

  const discountId = data?.codeDiscountNode?.id;

  return {
    success: true,
    coupon: couponCode,
    discountId: discountId
  };
}

module.exports = {
  createShopifyCoupon,
};