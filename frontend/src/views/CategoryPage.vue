<script setup>
import api from "../services/api.js";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "../composables/useToast.js";
import { useCart } from "../composables/useCart.js";

const route = useRoute();
const { notify } = useToast();
const { addToCart } = useCart();
const apiBaseUrl = `/api/v1`;
const categories = ref([]);
const category = ref(null);
const products = ref([]);
const currentPage = ref(1);
const pagination = ref({ currentPage: 1, totalPages: 1, totalProducts: 0 });
const isLoading = ref(true);
const loadError = ref("");
const isCategoryList = computed(() => !route.params.slug);
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

async function loadCategoryList() {
  const response = await api.get(`${apiBaseUrl}/categories/get-categories`);
  categories.value = response.data.data || [];
}

async function loadCategoryProducts() {
  const categoryResponse = await api.get(`${apiBaseUrl}/categories/single-category/${encodeURIComponent(route.params.slug)}`);
  category.value = categoryResponse.data.data;
  const productsResponse = await api.get(`${apiBaseUrl}/products/get-products`, {
    params: { category: category.value._id, page: currentPage.value },
  });
  products.value = productsResponse.data.data.products || [];
  pagination.value = productsResponse.data.data.pagination;
  currentPage.value = pagination.value.currentPage;
}

async function loadPage() {
  isLoading.value = true;
  loadError.value = "";
  products.value = [];
  category.value = null;
  currentPage.value = 1;
  try {
    if (route.params.slug) await loadCategoryProducts();
    else await loadCategoryList();
  } catch (error) {
    loadError.value = error.response?.data?.message || "Could not load categories.";
  } finally {
    isLoading.value = false;
  }
}

async function loadProductPage(page) {
  currentPage.value = page;
  isLoading.value = true;
  try {
    const response = await api.get(`${apiBaseUrl}/products/get-products`, {
      params: { category: category.value._id, page },
    });
    products.value = response.data.data.products || [];
    pagination.value = response.data.data.pagination;
    currentPage.value = pagination.value.currentPage;
  } catch (error) {
    notify(error.response?.data?.message || "Could not load more products.", "red");
  } finally {
    isLoading.value = false;
  }
}

function addProduct(product) {
  addToCart(product);
  notify(`${product.name} added to cart.`, "green");
}

watch(() => route.params.slug, loadPage, { immediate: true });
</script>

<template>
  <main class="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <RouterLink v-if="!isCategoryList" to="/category" class="mb-6 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">← All categories</RouterLink>
    <div v-if="isLoading" class="py-16 text-center text-slate-500">Loading categories…</div>
    <div v-else-if="loadError" class="rounded-xl border border-rose-100 bg-rose-50 p-6 text-rose-700">{{ loadError }}</div>

    <template v-else-if="isCategoryList">
      <header class="mb-7"><h1 class="text-3xl font-bold text-slate-900 sm:text-4xl">Shop by Category</h1><p class="mt-2 text-slate-500">Choose a category to browse its products.</p></header>
      <div v-if="!categories.length" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">No categories are available yet.</div>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <RouterLink v-for="item in categories" :key="item._id" :to="`/category/${encodeURIComponent(item.slug)}`" class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
          <h2 class="text-lg font-semibold text-slate-800 group-hover:text-blue-700">{{ item.name }}</h2>
          <span class="mt-4 inline-flex text-sm font-medium text-blue-600">Browse category →</span>
        </RouterLink>
      </div>
    </template>

    <template v-else-if="category">
      <header class="mb-7 flex flex-wrap items-end justify-between gap-3"><div><h1 class="text-3xl font-bold text-slate-900 sm:text-4xl">{{ category.name }}</h1><p class="mt-2 text-slate-500">{{ pagination.totalProducts }} product(s) in this category.</p></div></header>
      <div v-if="!products.length" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">There are no products in this category yet.</div>
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article v-for="product in products" :key="product._id" class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <RouterLink :to="`/product/${encodeURIComponent(product.slug)}`" class="aspect-square overflow-hidden bg-slate-50" :aria-label="`View ${product.name}`"><img v-if="product.images?.[0]?.url" :src="product.images[0].url" :alt="product.name" class="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105" loading="lazy" /><div v-else class="grid h-full place-items-center text-sm text-slate-400">No image</div></RouterLink>
          <div class="flex grow flex-col border-t border-slate-100 p-4"><h2 class="line-clamp-1 font-semibold text-slate-800">{{ product.name }}</h2><p class="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{{ product.description }}</p><div class="mt-auto flex items-center justify-between gap-2 pt-4"><span class="font-semibold text-blue-700">{{ currency.format(Number(product.price) || 0) }}</span><button type="button" class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" @click="addProduct(product)">Add to Cart</button></div></div>
        </article>
      </div>
      <nav v-if="pagination.totalPages > 1" class="mt-8 flex items-center justify-center gap-4" aria-label="Category product pages"><button type="button" :disabled="currentPage <= 1 || isLoading" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="loadProductPage(currentPage - 1)">Previous</button><span class="text-sm text-slate-600">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span><button type="button" :disabled="currentPage >= pagination.totalPages || isLoading" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="loadProductPage(currentPage + 1)">Next</button></nav>
    </template>
  </main>
</template>
