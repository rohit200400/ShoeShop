const storefront = {
  paymentUrl: "",
  shippingFlatRate: 8,
  dataFile: "./products.xlsx",
  sheetName: "Products",
  products: [],
};

const isFileProtocol = window.location.protocol === "file:";

const storageKey = "stride-local-cart";
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const elements = {
  productGrid: document.getElementById("product-grid"),
  categoryFilter: document.getElementById("category-filter"),
  spotlightCard: document.getElementById("spotlight-card"),
  spotlightName: document.getElementById("spotlight-name"),
  spotlightTagline: document.getElementById("spotlight-tagline"),
  spotlightCategory: document.getElementById("spotlight-category"),
  spotlightPrice: document.getElementById("spotlight-price"),
  cartButton: document.getElementById("cart-button"),
  cartCount: document.getElementById("cart-count"),
  cartDrawer: document.getElementById("cart-drawer"),
  closeCart: document.getElementById("close-cart"),
  cartItems: document.getElementById("cart-items"),
  drawerTotal: document.getElementById("drawer-total"),
  summaryItems: document.getElementById("summary-items"),
  summaryCount: document.getElementById("summary-count"),
  summarySubtotal: document.getElementById("summary-subtotal"),
  summaryShipping: document.getElementById("summary-shipping"),
  summaryTotal: document.getElementById("summary-total"),
  checkoutForm: document.getElementById("checkout-form"),
  checkoutNote: document.getElementById("checkout-note"),
  toast: document.getElementById("toast"),
};

let cart = loadCart();

elements.categoryFilter.addEventListener("change", renderProducts);
elements.cartButton.addEventListener("click", () => toggleCart(true));
elements.closeCart.addEventListener("click", () => toggleCart(false));
elements.checkoutForm.addEventListener("submit", handleCheckout);

initializeStorefront();

document.addEventListener("click", (event) => {
  if (
    elements.cartDrawer.classList.contains("open") &&
    !elements.cartDrawer.contains(event.target) &&
    !elements.cartButton.contains(event.target)
  ) {
    toggleCart(false);
  }
});

async function initializeStorefront() {
  try {
    const products = await loadProductsFromExcel(storefront.dataFile, storefront.sheetName);
    storefront.products = products;
    syncCartWithCatalog();
    populateCategoryFilter();
    renderSpotlight();
    renderProducts();
    renderCart();
    showToast(`Loaded ${products.length} products from Excel`);
  } catch (error) {
    console.error("Product load failed:", error);
    const localFileMessage =
      "This page was opened using file://. Start a local server, then open http://localhost so products.xlsx can be loaded.";
    const fallbackMessage =
      "Catalog data could not be loaded from products.xlsx. Check the file name, sheet name, and column headers.";
    const errorMessage = isFileProtocol ? localFileMessage : fallbackMessage;

    storefront.products = [];
    syncCartWithCatalog();
    populateCategoryFilter();
    renderSpotlight();
    renderProducts();
    renderCart();
    elements.checkoutNote.textContent = errorMessage;
    showToast(isFileProtocol ? "Use a local server to load Excel data" : "Could not load products.xlsx");
  }
}

async function loadProductsFromExcel(filePath, preferredSheetName) {
  if (typeof XLSX === "undefined") {
    throw new Error("SheetJS is not available");
  }

  if (isFileProtocol) {
    throw new Error("Blocked by browser security on file://. Serve this project over http://localhost.");
  }

  const response = await fetch(filePath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${filePath}`);
  }

  const data = await response.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.Sheets[preferredSheetName]
    ? preferredSheetName
    : workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Workbook does not contain any sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const products = rows
    .map((row, index) => normalizeProductRow(row, index))
    .filter(Boolean);

  if (!products.length) {
    throw new Error("No valid product rows found in Excel sheet");
  }

  return products;
}

function normalizeProductRow(row, index) {
  const normalized = normalizeRowKeys(row);
  const rawName = getValue(normalized, ["name", "productname", "title"]);
  const rawCategory = getValue(normalized, ["category", "type"]);
  const rawPrice = getValue(normalized, ["price", "amount", "cost"]);
  const rawImage = getValue(normalized, ["image", "imageurl", "img", "photo"]);
  const rawTagline = getValue(normalized, ["tagline", "description", "details"]);
  const rawSizes = getValue(normalized, ["sizes", "size", "availablesizes"]);
  const rawId = getValue(normalized, ["id", "sku", "productid"]);

  const name = String(rawName || "").trim();
  const category = String(rawCategory || "general").trim().toLowerCase();
  const image = String(rawImage || "").trim();
  const tagline = String(rawTagline || "").trim();
  const price = Number(rawPrice);

  if (!name || !image || Number.isNaN(price)) {
    return null;
  }

  const parsedSizes = parseSizes(rawSizes);
  const idBase = String(rawId || name).trim();

  return {
    id: `${slugify(idBase)}-${index + 1}`,
    name,
    category: category || "general",
    price,
    tagline: tagline || "Comfort-first footwear for everyday wear.",
    sizes: parsedSizes.length ? parsedSizes : [7, 8, 9],
    image,
  };
}

function normalizeRowKeys(row) {
  return Object.entries(row).reduce((result, [key, value]) => {
    const normalizedKey = String(key || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    result[normalizedKey] = value;
    return result;
  }, {});
}

function getValue(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return "";
}

function parseSizes(rawSizes) {
  if (Array.isArray(rawSizes)) {
    return rawSizes.map((size) => String(size).trim()).filter(Boolean);
  }

  return String(rawSizes || "")
    .split(/[,|;/]+/)
    .map((size) => size.trim())
    .filter(Boolean);
}

function populateCategoryFilter() {
  const categories = [...new Set(storefront.products.map((product) => product.category))].sort();
  const previousValue = elements.categoryFilter.value;

  elements.categoryFilter.innerHTML = [
    '<option value="all">All</option>',
    ...categories.map(
      (category) => `<option value="${escapeHtml(category)}">${escapeHtml(capitalize(category))}</option>`,
    ),
  ].join("");

  const shouldKeepPrevious = categories.includes(previousValue) || previousValue === "all";
  elements.categoryFilter.value = shouldKeepPrevious ? previousValue : "all";
}

function renderSpotlight() {
  const featuredProduct = storefront.products[0];

  if (!featuredProduct) {
    elements.spotlightName.textContent = "Catalog Not Loaded";
    elements.spotlightTagline.textContent = "Upload products.xlsx to drive this section dynamically.";
    elements.spotlightCategory.textContent = "Awaiting data";
    elements.spotlightPrice.textContent = "$0";
    return;
  }

  elements.spotlightName.textContent = featuredProduct.name;
  elements.spotlightTagline.textContent = featuredProduct.tagline;
  elements.spotlightCategory.textContent = capitalize(featuredProduct.category);
  elements.spotlightPrice.textContent = currency.format(featuredProduct.price);
  elements.spotlightCard.style.background =
    `linear-gradient(160deg, rgba(33, 21, 16, 0.1), rgba(33, 21, 16, 0.5)), url("${featuredProduct.image}") center/cover`;
}

function syncCartWithCatalog() {
  const validIds = new Set(storefront.products.map((product) => product.id));
  const nextCart = cart.filter((item) => validIds.has(item.id));

  if (nextCart.length !== cart.length) {
    cart = nextCart;
    persistCart();
  }
}

function renderProducts() {
  if (!storefront.products.length) {
    elements.productGrid.innerHTML =
      '<div class="empty-state">No products available. Upload products.xlsx and refresh.</div>';
    return;
  }

  const category = elements.categoryFilter.value;
  const visibleProducts =
    category === "all"
      ? storefront.products
      : storefront.products.filter((product) => product.category === category);

  if (!visibleProducts.length) {
    elements.productGrid.innerHTML =
      '<div class="empty-state">No products found for this category.</div>';
    return;
  }

  elements.productGrid.innerHTML = visibleProducts
    .map(
      (product, index) => `
        <article class="product-card" style="animation-delay: ${index * 70}ms">
          <figure>
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          </figure>
          <div class="product-copy">
            <div class="product-meta">
              <div>
                <span class="tag">${escapeHtml(capitalize(product.category))}</span>
                <h3>${escapeHtml(product.name)}</h3>
              </div>
              <strong class="price">${currency.format(product.price)}</strong>
            </div>
            <p>${escapeHtml(product.tagline)}</p>
            <div class="size-list">
              ${product.sizes.map((size) => `<span class="size-pill">US ${escapeHtml(String(size))}</span>`).join("")}
            </div>
            <button class="add-button" type="button" data-product-id="${product.id}">Add to cart</button>
          </div>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll(".add-button").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.productId));
  });
}

function addToCart(productId) {
  const productExists = storefront.products.some((product) => product.id === productId);

  if (!productExists) {
    showToast("This product is no longer available");
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  persistCart();
  renderCart();
  showToast("Added to cart");
  toggleCart(true);
}

function renderCart() {
  const detailedItems = getDetailedCartItems();
  const itemCount = detailedItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = detailedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = itemCount > 0 ? storefront.shippingFlatRate : 0;
  const total = subtotal + shipping;

  elements.cartCount.textContent = String(itemCount);
  elements.drawerTotal.textContent = currency.format(total);
  elements.summaryCount.textContent = String(itemCount);
  elements.summarySubtotal.textContent = currency.format(subtotal);
  elements.summaryShipping.textContent = currency.format(shipping);
  elements.summaryTotal.textContent = currency.format(total);

  const emptyMarkup = '<div class="empty-state">Your cart is empty. Add a few styles to continue.</div>';

  elements.cartItems.innerHTML = detailedItems.length
    ? detailedItems
        .map(
          (item) => `
            <div class="cart-line">
              <div>
                <p><strong>${escapeHtml(item.name)}</strong></p>
                <p>${currency.format(item.price)} each</p>
              </div>
              <div class="cart-qty">
                <button class="quantity-button" type="button" data-action="decrease" data-product-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-button" type="button" data-action="increase" data-product-id="${item.id}">+</button>
                <button class="remove-button" type="button" data-action="remove" data-product-id="${item.id}">x</button>
              </div>
            </div>
          `,
        )
        .join("")
    : emptyMarkup;

  elements.summaryItems.innerHTML = detailedItems.length
    ? detailedItems
        .map(
          (item) => `
            <div class="summary-card">
              <div class="summary-line">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${currency.format(item.price * item.quantity)}</span>
              </div>
              <p>Quantity: ${item.quantity}</p>
            </div>
          `,
        )
        .join("")
    : emptyMarkup;

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => updateQuantity(button.dataset.productId, button.dataset.action));
  });
}

function updateQuantity(productId, action) {
  const cartItem = cart.find((item) => item.id === productId);

  if (!cartItem) {
    return;
  }

  if (action === "increase") {
    cartItem.quantity += 1;
  }

  if (action === "decrease") {
    cartItem.quantity -= 1;
  }

  if (action === "remove" || cartItem.quantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
  }

  persistCart();
  renderCart();
}

function handleCheckout(event) {
  event.preventDefault();

  const detailedItems = getDetailedCartItems();

  if (!detailedItems.length) {
    showToast("Add at least one product before checkout");
    return;
  }

  if (!storefront.paymentUrl) {
    elements.checkoutNote.textContent =
      "Static hosting cannot process cards directly. Add a hosted Stripe, PayPal, or similar payment URL in script.js to activate this button.";
    showToast("Payment link is not configured yet");
    return;
  }

  const formData = new FormData(elements.checkoutForm);
  const payload = {
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    deliveryMethod: formData.get("deliveryMethod"),
    orderNotes: formData.get("orderNotes"),
    items: detailedItems,
  };

  sessionStorage.setItem("stride-local-order", JSON.stringify(payload));
  window.open(storefront.paymentUrl, "_blank", "noopener,noreferrer");
}

function getDetailedCartItems() {
  return cart
    .map((item) => {
      const product = storefront.products.find((candidate) => candidate.id === item.id);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);
}

function loadCart() {
  try {
    const savedCart = localStorage.getItem(storageKey);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
}

function persistCart() {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

function toggleCart(isOpen) {
  elements.cartDrawer.classList.toggle("open", isOpen);
  elements.cartDrawer.setAttribute("aria-hidden", String(!isOpen));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function slugify(value) {
  return String(value || "product")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "") || "product";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
