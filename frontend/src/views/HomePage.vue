<script setup>
import api from "../services/api.js";
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useToast } from "../composables/useToast.js";
import { useCart } from "../composables/useCart.js";

const { notify } = useToast();
const { addToCart } = useCart();
const products = ref([]);
const categories = ref([]);
const selectedCategories = ref([]);
const selectedPriceRange = ref("");
const draftSearch = ref("");
const appliedSearch = ref("");
const currentPage = ref(1);
const pagination = ref({ currentPage: 1, totalPages: 1, totalProducts: 0 });
const isLoading = ref(true);
const loadError = ref("");
const priceRanges = [
  { label: "$0 to 19", min: 0, max: 19 },
  { label: "$20 to 39", min: 20, max: 39 },
  { label: "$40 to 59", min: 40, max: 59 },
  { label: "$60 to 79", min: 60, max: 79 },
  { label: "$80 to 99", min: 80, max: 99 },
  { label: "$100 or more", min: 100 },
];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const activePriceRange = computed(() => priceRanges.find((range) => range.label === selectedPriceRange.value));

async function loadProducts() {
  isLoading.value = true;
  loadError.value = "";
  const params = { page: currentPage.value };
  if (selectedCategories.value.length) params.category = selectedCategories.value.join(",");
  if (appliedSearch.value) params.search = appliedSearch.value;
  if (activePriceRange.value) {
    params.minPrice = activePriceRange.value.min;
    if (activePriceRange.value.max !== undefined) params.maxPrice = activePriceRange.value.max;
  }
  try {
    const response = await api.get(`/api/v1/products/get-products`, { params });
    products.value = response.data.data.products || [];
    pagination.value = response.data.data.pagination;
    currentPage.value = pagination.value.currentPage;

    console.log("====================== ", response.data)
    console.log("++++++++++++++++++++++ ", response.data.data)
  } catch (error) {
    loadError.value = error.response?.data?.message || "Could not load the store right now.";
  } finally {
    isLoading.value = false;
  }
}

async function loadCategories() {
  try {
    const response = await api.get(`/api/v1/categories/get-categories`);
    categories.value = response.data.data || [];
  } catch (error) {
    notify(error.response?.data?.message || "Could not load categories.", "red");
  }
}

function toggleCategory(categoryId, checked) {
  selectedCategories.value = checked
    ? [...selectedCategories.value, categoryId]
    : selectedCategories.value.filter((id) => id !== categoryId);
}

function clearFilters() {
  selectedCategories.value = [];
  selectedPriceRange.value = "";
  draftSearch.value = "";
  appliedSearch.value = "";
  currentPage.value = 1;
}

function addProduct(product) {
  addToCart(product);
  notify(`${product.name} added to cart.`, "green");
}

let searchTimer;
watch(draftSearch, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    appliedSearch.value = draftSearch.value.trim();
    currentPage.value = 1;
  }, 350);
});

watch([currentPage, selectedCategories, selectedPriceRange, appliedSearch], loadProducts, { immediate: true });
onMounted(loadCategories);
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside class="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <h2 class="whitespace-nowrap text-lg font-semibold text-slate-800">Filter By Category</h2><button
            v-if="selectedCategories.length || selectedPriceRange" type="button"
            class="text-xs font-semibold text-blue-600 hover:text-blue-700" @click="clearFilters">Clear</button>
        </div>
        <p v-if="!categories.length" class="mt-3 text-sm text-slate-500">No categories available.</p>
        <div v-else class="mt-3 space-y-2"><label v-for="category in categories" :key="category._id"
            class="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 hover:text-blue-700"><input
              type="checkbox" :checked="selectedCategories.includes(category._id)"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              @change="toggleCategory(category._id, $event.target.checked)" /><span>{{ category.name }}</span></label>
        </div>
        <fieldset class="mt-8">
          <legend class="text-lg font-semibold text-slate-800">Filter By Price</legend>
          <div class="mt-3 space-y-2"><label v-for="range in priceRanges" :key="range.label"
              class="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 hover:text-blue-700"><input
                v-model="selectedPriceRange" type="radio" name="price-range" :value="range.label"
                class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" /><span>{{ range.label
                }}</span></label></div>
        </fieldset>
      </aside>
      <section class="min-w-0">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-center text-3xl font-semibold text-slate-800 sm:text-left sm:text-4xl">All Products</h1>
            <p class="mt-1 text-center text-sm text-slate-500 sm:text-left">Find something you’ll love.</p>
          </div><span v-if="!isLoading && !loadError" class="text-sm text-slate-500">{{ pagination.totalProducts }}
            products</span>
        </div>
        <div class="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-1">
          <label class="sr-only" for="product-search">Search product name or description</label>
          <input id="product-search" v-model="draftSearch" type="text" maxlength="100"
            placeholder="Search by product name or description"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>

        <div v-if="isLoading" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div v-for="n in 3" :key="n"
            class="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div class="aspect-square bg-slate-100"></div>
            <div class="space-y-3 p-4">
              <div class="h-4 w-2/3 rounded bg-slate-100"></div>
              <div class="h-3 w-full rounded bg-slate-100"></div>
            </div>
          </div>
        </div>
        <div v-else-if="loadError" class="rounded-xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
          <p>{{ loadError }}</p><button type="button" class="mt-3 font-semibold underline" @click="loadProducts">Try
            again</button>
        </div>
        <div v-else-if="!products.length"
          class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 class="font-semibold text-slate-700">No products match these filters</h2>
          <p class="mt-1 text-sm text-slate-500">Try another category or price range.</p>
        </div>
        <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <article v-for="product in products" :key="product._id"
            class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <RouterLink :to="`/product/${encodeURIComponent(product.slug)}`"
              class="block aspect-square overflow-hidden bg-slate-50" :aria-label="`View ${product.name} details`"><img
                v-if="product.images?.[0]?.url" :src="product.images[0].url" :alt="product.name"
                class="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105" loading="lazy" />
              <div v-else class="grid h-full place-items-center text-sm text-slate-400">No image available</div>
            </RouterLink>
            <div class="flex grow flex-col border-t border-slate-100 p-4">
              <div class="flex items-start justify-between gap-3">
                <h2 class="line-clamp-1 font-semibold text-slate-800">{{ product.name }}</h2><span
                  class="shrink-0 font-semibold text-blue-700">{{ currency.format(Number(product.price) || 0) }}</span>
              </div>
              <p class="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{{ product.description }}</p>
              <p class="mt-2 text-xs text-slate-500">{{ product.category?.name || "Uncategorized" }}</p>
              <div class="mt-auto grid grid-cols-2 gap-2 pt-4">
                <RouterLink :to="`/product/${encodeURIComponent(product.slug)}`"
                  class="rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700">
                  More Details</RouterLink><button type="button"
                  class="rounded-lg bg-slate-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  @click="addProduct(product)">Add to Cart</button>
              </div>
            </div>
          </article>
        </div>
        <nav v-if="!isLoading && !loadError && pagination.totalPages > 1" class="mt-8 flex items-center justify-center gap-4" aria-label="Product pages"><button type="button" :disabled="currentPage <= 1" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="currentPage--">Previous</button><span class="text-sm text-slate-600">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span><button type="button" :disabled="currentPage >= pagination.totalPages" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" @click="currentPage++">Next</button></nav>
      </section>
    </div>
  </main>
</template>
