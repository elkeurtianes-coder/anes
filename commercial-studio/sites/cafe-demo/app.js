const menuItems = [
  { name: "House espresso", category: "coffee", label: "Coffee", description: "Short, rich, and bright.", price: "Sample price" },
  { name: "Slow filter", category: "coffee", label: "Coffee", description: "A mellow cup for the walk.", price: "Sample price" },
  { name: "Citrus tonic", category: "cold", label: "Cold", description: "Espresso, tonic, and orange peel.", price: "Sample price" },
  { name: "Oat cloud", category: "cold", label: "Cold", description: "Iced coffee with a soft oat finish.", price: "Sample price" },
  { name: "Olive-oil cake", category: "food", label: "Something to eat", description: "A tender slice with a crisp edge.", price: "Sample price" },
  { name: "Salted cookie", category: "food", label: "Something to eat", description: "A small sweet with a little salt.", price: "Sample price" }
];
const list = document.getElementById("menu-items");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}
function renderMenu(filter) {
  const visible = menuItems.filter(function (item) {
    return filter === "all" || item.category === filter;
  });
  list.innerHTML = visible.map(function (item) {
    return '<li class="menu-item"><div><p class="menu-name">' + escapeHtml(item.name) + '</p><p class="menu-description">' + escapeHtml(item.description) + '</p></div><div class="menu-meta"><span class="menu-category">' + escapeHtml(item.label) + '</span><span class="menu-price">' + escapeHtml(item.price) + '</span></div></li>';
  }).join("");
}
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    filterButtons.forEach(function (item) {
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
    renderMenu(button.dataset.filter);
  });
});
renderMenu("all");
