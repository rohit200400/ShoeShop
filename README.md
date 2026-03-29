# Stride Local

Simple static storefront for a local footwear shop.

The catalog is now data-driven from an Excel workbook in the repository.

## What this includes

- Product browsing by category
- Add to cart and quantity updates
- Cart persistence with local storage
- Checkout form for customer details
- Payment handoff placeholder for static hosting
- Product data loaded from Excel (`products.xlsx`)

## Excel-driven catalog

1. Add a file named `products.xlsx` in the project root.
2. Use a sheet named `Products` (or keep any single first sheet).
3. Add these columns in row 1:

- `name`
- `category`
- `price`
- `image`
- `tagline` (optional)
- `sizes` (optional, comma-separated like `6,7,8,9`)
- `id` (optional)

### Example rows

| name | category | price | image | tagline | sizes | id |
| --- | --- | ---: | --- | --- | --- | --- |
| WalkLite Runner | running | 68 | https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80 | Daily training shoe with soft rebound foam. | 6,7,8,9,10 | walklite-runner |
| Harbor Slip-On | casual | 52 | https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80 | Easy canvas comfort for quick city errands. | 6,7,8,9 | harbor-slipon |

If `id` is missing, one is generated automatically.
If `sizes` is missing, default sizes are used.

## Run locally (important)

Do not open `index.html` directly with `file://` in the browser. Browser security blocks JavaScript from loading `products.xlsx` in that mode.

Start a local server from this folder, then open the printed localhost URL:

```bash
python -m http.server 5500
```

Then browse to:

```text
http://localhost:5500
```

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
  dataFile: "./products.xlsx",
  sheetName: "Products",
  products: [],
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
