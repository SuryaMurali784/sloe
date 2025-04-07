
let cart = [];

function addToCart(productName, price) {
  cart.push({ name: productName, price });
  updateCart();
}

function updateCart() {
  const cartEl = document.getElementById("cart");
  cartEl.innerHTML = "<h2>Cart</h2>" + cart.map(
    item => `<p>${item.name} - $${item.price.toFixed(2)}</p>`
  ).join("");
}
