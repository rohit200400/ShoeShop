const storefront = {
  paymentUrl: "",
  shippingFlatRate: 8,
  products: [
    {
      id: "walklite-runner",
      name: "WalkLite Runner",
      category: "running",
      price: 68,
      tagline: "Daily training shoe with soft rebound foam.",
      sizes: [6, 7, 8, 9, 10],
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "harbor-slipon",
      name: "Harbor Slip-On",
      category: "casual",
      price: 52,
      tagline: "Easy canvas comfort for quick city errands.",
      sizes: [6, 7, 8, 9],
      image:
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "avenue-oxford",
      name: "Avenue Oxford",
      category: "formal",
      price: 89,
      tagline: "Polished leather silhouette for office and events.",
      sizes: [7, 8, 9, 10, 11],
      image:
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "suntrail-sandal",
      name: "Suntrail Sandal",
      category: "sandals",
      price: 34,
      tagline: "Breathable strap sandal for warm-weather walks.",
      sizes: [5, 6, 7, 8, 9],
      image:
        "https://images.unsplash.com/photo-1608256246200-53e8b47b2f80?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "metro-court",
      name: "Metro Court",
      category: "casual",
      price: 61,
      tagline: "Clean low-top style with cushioned support.",
      sizes: [6, 7, 8, 9, 10, 11],
      image:
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "pace-knit",
      name: "Pace Knit",
      category: "running",
      price: 74,
      tagline: "Flexible knit upper for light runs and errands.",
      sizes: [7, 8, 9, 10],
      image:
        "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
    },
  ],
};

const storageKey = "stride-local-cart";
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const elements = {
  productGrid: document.getElementById("product-grid"),
  categoryFilter: document.getElementById("category-filter"),
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

renderProducts();
renderCart();

elements.categoryFilter.addEventListener("change", renderProducts);
elements.cartButton.addEventListener("click", () => toggleCart(true));
elements.closeCart.addEventListener("click", () => toggleCart(false));
elements.checkoutForm.addEventListener("submit", handleCheckout);

document.addEventListener("click", (event) => {
  if (
    elements.cartDrawer.classList.contains("open") &&
    !elements.cartDrawer.contains(event.target) &&
    !elements.cartButton.contains(event.target)
  ) {
    toggleCart(false);
  }
});

function renderProducts() {
  const category = elements.categoryFilter.value;
  const visibleProducts =
    category === "all"
      ? storefront.products
      : storefront.products.filter((product) => product.category === category);

  elements.productGrid.innerHTML = visibleProducts
    .map(
      (product, index) => `
        <article class="product-card" style="animation-delay: ${index * 70}ms">
          <figure>
            <img src="${product.image}" alt="${product.name}" />
          </figure>
          <div class="product-copy">
            <div class="product-meta">
              <div>
                <span class="tag">${capitalize(product.category)}</span>
                <h3>${product.name}</h3>
              </div>
              <strong class="price">${currency.format(product.price)}</strong>
            </div>
            <p>${product.tagline}</p>
            <div class="size-list">
              ${product.sizes.map((size) => `<span class="size-pill">US ${size}</span>`).join("")}
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
                <p><strong>${item.name}</strong></p>
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
                <strong>${item.name}</strong>
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