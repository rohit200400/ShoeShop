# Stride Local

Simple static storefront for a local footwear shop.

## What this includes

- Product browsing by category
- Add to cart and quantity updates
- Cart persistence with local storage
- Checkout form for customer details
- Payment handoff placeholder for static hosting

## Why this works on GitHub Pages

GitHub Pages only hosts static files. That means:

- The catalog, cart, and checkout UI can run entirely in the browser
- Real card processing cannot happen directly inside this site without a hosted payment provider or backend

## How to enable payment later

Open [script.js](./script.js) and set the `paymentUrl` value near the top.

Examples:

- Stripe Payment Link
- PayPal hosted checkout link
- Any external hosted checkout page

```js
const storefront = {
  paymentUrl: "https://your-payment-link-here",
  shippingFlatRate: 8,
  products: [
    // ...
  ],
};
```

When the payment URL is empty, the checkout button stays as a placeholder and shows an explanatory message.

## Publish to GitHub Pages

1. Create a GitHub repository and push these files.
2. In the repository settings, open Pages.
3. Set the source to deploy from the main branch root.
4. Wait for GitHub Pages to publish the site.

## Recommended next upgrade

If you want dynamic cart totals to go directly into payment, use one of these:

- Snipcart for static storefronts
- Stripe with serverless functions
- PayPal commerce buttons