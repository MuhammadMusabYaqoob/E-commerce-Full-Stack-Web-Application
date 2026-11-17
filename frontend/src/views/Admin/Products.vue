<script setup>
import api from "../../services/api.js";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const { notify } = useToast();
const products = ref([]);
const currentPage = ref(1);
const pagination = ref({ currentPage: 1, totalPages: 1, totalProducts: 0 });
const isLoading = ref(false);
const failedToLoad = ref(false);

async function loadProducts() {
  isLoading.value = true;
  failedToLoad.value = false;
  try {
    const response = await api.get(`/api/v1/products/get-products`, { params: { page: currentPage.value } });
    products.value = response.data.data.products || [];
    pagination.value = response.data.data.pagination;
    currentPage.value = pagination.value.currentPage;
  } catch (error) {
    failedToLoad.value = true;
    notify(error.response?.data?.message || "Could not load products.", "red");
  } finally {
    isLoading.value = false;
  }
}

watch(currentPage, loadProducts, { immediate: true });
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="text-2xl font-semibold text-slate-800 sm:text-3xl">All Products</h2><p class="mt-1 text-sm text-slate-500">Select a product to view and edit its details.</p></div><RouterLink to="./products/new" class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Add Product</RouterLink></div>
    <p v-if="isLoading" class="py-12 text-center text-slate-500">Loading products…</p>
    <div v-else-if="failedToLoad" class="py-12 text-center"><p class="text-slate-600">Products could not be loaded.</p><button type="button" class="mt-3 font-semibold text-blue-600 hover:text-blue-700" @click="loadProducts">Try again</button></div>
    <div v-else-if="!products.length" class="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><p class="font-medium text-slate-700">No products yet</p><p class="mt-1 text-sm text-slate-500">Add your first product to see it here.</p></div>
    <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink v-for="product in products" :key="product._id" :to="`${route.path}/${encodeURIComponent(product.slug)}/edit`" class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100" :aria-label="`Edit ${product.name}`">
        <div class="aspect-square overflow-hidden bg-slate-50"><img v-if="product.images?.[0]?.url" :src="product.images[0].url" :alt="product.name" class="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105" loading="lazy" /><div v-else class="grid h-full place-items-center text-sm text-slate-400">No image</div></div>
        <div class="border-t border-slate-100 p-4"><div class="flex items-start justify-between gap-3"><h3 class="line-clamp-1 font-semibold text-slate-800">{{ product.name }}</h3><span class="shrink-0 font-semibold text-blue-700">{{ Number(product.price).toLocaleString(undefined, { style: "currency", currency: "USD" }) }}</span></div><p class="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{{ product.description }}</p><div class="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{{ product.category?.name || "Uncategorized" }}</span><span>{{ product.images?.length || 0 }} photo(s)</span></div><span class="mt-4 inline-flex text-sm font-semibold text-blue-600 group-hover:text-blue-700">View / Edit product →</span></div>
      </RouterLink>
    </div>
    <nav v-if="!isLoading && !failedToLoad && pagination.totalPages > 1" class="mt-8 flex items-center justify-center gap-4" aria-label="Product pages"><button type="button" :disabled="currentPage <= 1" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="currentPage--">Previous</button><span class="text-sm text-slate-600">Page {{ pagination.currentPage }} of {{ pagination.totalPages }} · {{ pagination.totalProducts }} products</span><button type="button" :disabled="currentPage >= pagination.totalPages" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="currentPage++">Next</button></nav>
  </section>
</template>
