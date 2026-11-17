<script setup>
import api from "../../services/api.js";
import { onMounted, reactive, ref } from "vue";
import { useToast } from "../../composables/useToast.js";

const { notify } = useToast();
const categories = ref([]);
const selectedPhotos = ref([]);
const fileInput = ref(null);
const isLoadingCategories = ref(false);
const isSubmitting = ref(false);
const formData = reactive({
  name: "",
  description: "",
  price: "",
  category: "",
  shipping: false,
});

async function loadCategories() {
  isLoadingCategories.value = true;
  try {
    const response = await api.get(
      `/api/v1/categories/get-categories`
    );
    categories.value = response.data.data || [];
  } catch (error) {
    notify(error.response?.data?.message || "Could not load categories.", "red");
  } finally {
    isLoadingCategories.value = false;
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

async function submitForm() {
  if (!selectedPhotos.value.length) {
    notify("Choose at least one product photo.", "red");
    return;
  }

  isSubmitting.value = true;
  const productData = new FormData();
  productData.append("name", formData.name.trim());
  productData.append("description", formData.description.trim());
  productData.append("price", formData.price);
  productData.append("category", formData.category);
  productData.append("shipping", String(formData.shipping));
  selectedPhotos.value.forEach((photo) => productData.append("photos", photo));

  try {
    await api.post(
      `/api/v1/products/create-product`,
      productData,
      { withCredentials: true }
    );
    notify("Product created successfully.", "green");
    formData.name = "";
    formData.description = "";
    formData.price = "";
    formData.category = "";
    formData.shipping = false;
    selectedPhotos.value = [];
    if (fileInput.value) fileInput.value.value = "";
  } catch (error) {
    notify(error.response?.data?.message || "Could not create the product.", "red");
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(loadCategories);
</script>

<template>
  <section class="mx-auto w-full max-w-3xl">
    <h2 class="text-2xl font-semibold text-slate-800">Create Product</h2>
    <p class="mt-1 text-sm text-slate-500">Add product details and upload up to five product images.</p>

    <form class="mt-6 space-y-5" @submit.prevent="submitForm">
      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Product name</span>
        <input v-model="formData.name" required maxlength="120"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="e.g. Wireless headphones" />
      </label>

      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Description</span>
        <textarea v-model="formData.description" required rows="4" maxlength="3000"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Describe the product"></textarea>
      </label>

      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block space-y-2">
          <span class="font-medium text-slate-700">Price</span>
          <input v-model="formData.price" required type="number" min="0" step="0.01"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="0.00" />
        </label>

        <label class="block space-y-2">
          <span class="font-medium text-slate-700">Category</span>
          <select v-model="formData.category" required :disabled="isLoadingCategories || !categories.length"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="" disabled>{{ isLoadingCategories ? "Loading categories…" : "Select a category" }}</option>
            <option v-for="category in categories" :key="category._id" :value="category._id">{{ category.name }}
            </option>
          </select>
          <span v-if="!isLoadingCategories && !categories.length" class="text-sm text-amber-700">Create a category
            before adding products.</span>
        </label>
      </div>

      <label class="block space-y-2">
        <span class="font-medium text-slate-700">Product photos</span>
        <input ref="fileInput" type="file" accept="image/*" multiple required
          class="block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          @change="selectPhotos" />
        <span v-if="selectedPhotos.length" class="block text-sm text-slate-500">{{ selectedPhotos.length }} photo(s)
          selected: {{selectedPhotos.map((photo) => photo.name).join(", ")}}</span>
        <span class="block text-xs text-slate-500">Choose up to 5 images; each image can be up to 5 MB.</span>
      </label>

      <label class="flex items-center gap-3 text-slate-700">
        <input v-model="formData.shipping" type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
        <span>Shipping is available for this product</span>
      </label>

      <button type="submit" :disabled="isSubmitting || isLoadingCategories || !categories.length"
        class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
        {{ isSubmitting ? "Uploading product photos…" : "Create Product" }}
      </button>
    </form>
  </section>
</template>
