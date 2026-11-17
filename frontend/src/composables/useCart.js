import { computed, ref } from "vue";

const STORAGE_KEY = "storeCart";
function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item?.product?._id && Number(item.quantity) > 0) : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

const items = ref(readCart());
const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0));
const subtotal = computed(() => items.value.reduce((total, item) => total + (Number(item.product.price) || 0) * item.quantity, 0));

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
}

export function useCart() {
  function addToCart(product) {
    if (!product?._id) return;
    const existing = items.value.find((item) => item.product._id === product._id);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 99);
    else items.value.push({ product, quantity: 1 });
    saveCart();
  }
  function removeFromCart(productId) {
    items.value = items.value.filter((item) => item.product._id !== productId);
    saveCart();
  }
  function setQuantity(productId, value) {
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));
    const item = items.value.find((entry) => entry.product._id === productId);
    if (item) { item.quantity = quantity; saveCart(); }
  }
  function clearCart() { items.value = []; saveCart(); }
  return { items, itemCount, subtotal, addToCart, removeFromCart, setQuantity, clearCart };
}
