<script setup>
import api from "../services/api.js";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "../composables/useToast.js";
import { useCart } from "../composables/useCart.js";

const route = useRoute();
const { notify } = useToast();
const { addToCart } = useCart();
const product = ref(null);
const relatedProducts = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const apiBaseUrl = `/api/v1/products`;

async function loadProduct(slug) {
  isLoading.value = true;
  errorMessage.value = "";
  product.value = null;
  relatedProducts.value = [];
  try {
    const response = await api.get(`${apiBaseUrl}/single-product/${encodeURIComponent(slug)}`);
    product.value = response.data.data;

    const categoryId = product.value.category?._id;
    if (categoryId) {
      try {
        const relatedResponse = await api.get(`${apiBaseUrl}/get-products`, {
          params: { category: categoryId, page: 1 },
        });
        relatedProducts.value = (relatedResponse.data.data.products || [])
          .filter((item) => item._id !== product.value._id)
          .slice(0, 4);
      } catch {
        // Related items are optional; keep the product details visible if this request fails.
        relatedProducts.value = [];
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not load this product.";
  } finally {
    isLoading.value = false;
  }
}

function addProductToCart(item) {
  addToCart(item);
  notify(`${item.name} added to cart.`, "green");
}

watch(() => route.params.slug, (slug) => {
  if (slug) loadProduct(slug);
}, { immediate: true });
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <RouterLink to="/" class="mb-6 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to products</RouterLink>
    <p v-if="isLoading" class="py-16 text-center text-slate-500">Loading product…</p>
    <div v-else-if="errorMessage" class="rounded-xl border border-rose-100 bg-rose-50 p-6 text-rose-700">{{ errorMessage }}</div>
    <template v-else-if="product">
      <section class="grid gap-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
        <div class="grid grid-cols-2 gap-3 self-start">
          <div v-for="(image, index) in product.images" :key="image.publicId" class="aspect-square overflow-hidden rounded-xl bg-slate-50" :class="{ 'col-span-2 row-span-2': index === 0 }"><img :src="image.url" :alt="`${product.name} photo ${index + 1}`" class="h-full w-full object-contain p-4" /></div>
        </div>
        <div class="flex flex-col justify-center">
          <p class="text-sm font-medium text-blue-600">{{ product.category?.name || "Product" }}</p>
          <h1 class="mt-2 text-3xl font-bold text-slate-900">{{ product.name }}</h1>
          <p class="mt-4 text-2xl font-semibold text-slate-800">{{ currency.format(Number(product.price) || 0) }}</p>
          <p class="mt-5 whitespace-pre-line leading-7 text-slate-600">{{ product.description }}</p>
          <p class="mt-4 text-sm" :class="product.shipping ? 'text-emerald-700' : 'text-slate-500'">{{ product.shipping ? "Shipping available" : "Shipping details available at checkout" }}</p>
          <button type="button" class="mt-7 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-fit" @click="addProductToCart(product)">Add to Cart</button>
        </div>
      </section>

      <section class="mt-12">
        <div class="mb-5"><h2 class="text-2xl font-bold text-slate-900">Related Products</h2><p class="mt-1 text-sm text-slate-500">More products in {{ product.category?.name || "this category" }}.</p></div>
        <p v-if="!relatedProducts.length" class="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">No similar products found in this category yet.</p>
        <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="related in relatedProducts" :key="related._id" class="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <RouterLink :to="`/product/${encodeURIComponent(related.slug)}`" class="aspect-square overflow-hidden bg-slate-50" :aria-label="`View ${related.name}`">
              <img v-if="related.images?.[0]?.url" :src="related.images[0].url" :alt="related.name" class="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105" loading="lazy" />
              <div v-else class="grid h-full place-items-center text-sm text-slate-400">No image</div>
            </RouterLink>
            <div class="flex grow flex-col border-t border-slate-100 p-4">
              <h3 class="line-clamp-1 font-semibold text-slate-800">{{ related.name }}</h3>
              <p class="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">{{ related.description }}</p>
              <div class="mt-auto flex items-center justify-between gap-2 pt-4">
                <span class="font-semibold text-blue-700">{{ currency.format(Number(related.price) || 0) }}</span>
                <button type="button" class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800" @click="addProductToCart(related)">Add to Cart</button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </main>
</template>

