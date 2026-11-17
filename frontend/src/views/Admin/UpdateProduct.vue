<script setup>
import api from "../../services/api.js";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "../../composables/useToast.js";

const route = useRoute();
const router = useRouter();
const { notify } = useToast();
const product = ref(null);
const categories = ref([]);
const selectedPhotos = ref([]);
const fileInput = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const formData = reactive({ name: "", description: "", price: "", category: "", shipping: false });
const productsPath = computed(() => route.path.startsWith("/dashboard/seller") ? "/dashboard/seller/products" : "/dashboard/admin/products");
const apiBaseUrl = `/api/v1`;

async function loadProduct() {
  isLoading.value = true;
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get(`${apiBaseUrl}/products/single-product/${encodeURIComponent(route.params.slug)}`),
      api.get(`${apiBaseUrl}/categories/get-categories`),
    ]);
    product.value = productResponse.data.data;
    categories.value = categoryResponse.data.data || [];
    formData.name = product.value.name;
    formData.description = product.value.description;
    formData.price = product.value.price;
    formData.category = product.value.category?._id || product.value.category;
    formData.shipping = Boolean(product.value.shipping);
  } catch (error) {
    notify(error.response?.data?.message || "Could not load this product.", "red");
  } finally {
    isLoading.value = false;
  }
}

function selectPhotos(event) {
  selectedPhotos.value = Array.from(event.target.files || []);
  if (selectedPhotos.value.length > 5) {
    selectedPhotos.value = [];
    event.target.value = "";
    notify("Choose no more than 5 product photos.", "red");
  }
}

async function saveProduct() {
  if (!product.value) return;
  isSaving.value = true;
  const data = new FormData();
  data.append("name", formData.name.trim());
  data.append("description", formData.description.trim());
  data.append("price", String(formData.price));
  data.append("category", formData.category);
  data.append("shipping", String(formData.shipping));
  selectedPhotos.value.forEach((photo) => data.append("photos", photo));

  try {
    await api.put(`${apiBaseUrl}/products/update-product/${product.value._id}`, data, { withCredentials: true });
    notify("Product updated successfully.", "green");
    await router.push(productsPath.value);
  } catch (error) {
    notify(error.response?.data?.message || "Could not update this product.", "red");
  } finally {
    isSaving.value = false;
  }
}

async function deleteProduct() {
  if (!product.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`${apiBaseUrl}/products/delete-product/${product.value._id}`, { withCredentials: true });
    showDeleteConfirm.value = false;
    notify("Product deleted successfully.", "green");
    await router.push(productsPath.value);
  } catch (error) {
    notify(error.response?.data?.message || "Could not delete this product.", "red");
  } finally {
    isDeleting.value = false;
  }
}

onMounted(loadProduct);
</script>

<template>
  <section class="mx-auto w-full max-w-3xl">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800 sm:text-3xl">Update Product</h2>
        <p class="mt-1 text-sm text-slate-500">Edit product details and manage its photos.</p>
      </div>
      <RouterLink :to="productsPath" class="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to Products</RouterLink>
    </div>

    <p v-if="isLoading" class="py-12 text-center text-slate-500">Loading product…</p>
    <div v-else-if="!product" class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Product could not be loaded. Use the Products link to return to the list.</div>

    <form v-else class="space-y-5" @submit.prevent="saveProduct">
      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Product name</span>
        <input v-model="formData.name" required maxlength="120" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      </label>
      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Category</span>
        <select v-model="formData.category" required class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option v-for="category in categories" :key="category._id" :value="category._id">{{ category.name }}</option>
        </select>
      </label>
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-2">
          <span class="font-medium text-slate-700">Price</span>
          <input v-model="formData.price" required type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label class="flex items-center gap-3 self-end pb-3 text-slate-700">
          <input v-model="formData.shipping" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span>Shipping is available</span>
        </label>
      </div>
      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Description</span>
        <textarea v-model="formData.description" required rows="4" maxlength="3000" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"></textarea>
      </label>

      <div>
        <h3 class="font-medium text-slate-700">Current photos</h3>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div v-for="(image, index) in product.images" :key="image.publicId" class="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img :src="image.url" :alt="`${product.name} image ${index + 1}`" class="h-full w-full object-contain p-2" />
          </div>
        </div>
      </div>
      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Replace photos (optional)</span>
        <input ref="fileInput" type="file" accept="image/*" multiple class="block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100" @change="selectPhotos" />
        <span v-if="selectedPhotos.length" class="block text-sm text-slate-500">{{ selectedPhotos.length }} new photo(s) selected. These will replace all current photos.</span>
        <span class="block text-xs text-slate-500">Leave empty to keep the current photos. Up to 5 images, 5 MB each.</span>
      </label>

      <div class="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
        <button type="button" class="rounded-lg border border-rose-200 px-4 py-2.5 font-semibold text-rose-600 transition hover:bg-rose-50" @click="showDeleteConfirm = true">Delete Product</button>
        <button type="submit" :disabled="isSaving || isLoading" class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{{ isSaving ? "Saving changes…" : "Save Changes" }}</button>
      </div>
    </form>

    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-[2px]" @click.self="!isDeleting && (showDeleteConfirm = false)" @keydown.esc="!isDeleting && (showDeleteConfirm = false)">
      <section class="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 font-bold text-rose-600">!</div>
        <h3 id="delete-product-title" class="text-xl font-bold text-slate-800">Delete this product?</h3>
        <p class="mt-2 text-sm leading-6 text-slate-500">This will delete <strong class="text-slate-700">{{ product?.name }}</strong> and its Cloudinary photos. This cannot be undone.</p>
        <div class="mt-7 flex justify-end gap-3">
          <button type="button" :disabled="isDeleting" class="rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60" @click="showDeleteConfirm = false">Cancel</button>
          <button type="button" :disabled="isDeleting" class="rounded-lg bg-rose-500 px-4 py-2.5 font-semibold text-white hover:bg-rose-600 disabled:opacity-60" @click="deleteProduct">{{ isDeleting ? "Deleting…" : "Yes, Delete" }}</button>
        </div>
      </section>
    </div>
  </section>
</template>
