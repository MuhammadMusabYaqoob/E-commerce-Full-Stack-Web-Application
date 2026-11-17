<script setup>
import api from "../../services/api.js";
import { onMounted, ref } from "vue";
import { useToast } from "../../composables/useToast.js";

const { notify } = useToast();
const categories = ref([]);
const newCategoryName = ref("");
const editingCategory = ref(null);
const editName = ref("");
const deletingCategory = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);

const apiBaseUrl = `/api/v1/categories`;

async function loadCategories() {
  isLoading.value = true;
  try {
    const response = await api.get(`${apiBaseUrl}/get-categories`);
    categories.value = response.data.data || [];
  } catch (error) {
    notify(error.response?.data?.message || "Could not load categories.", "red");
  } finally {
    isLoading.value = false;
  }
}

async function createCategory() {
  const name = newCategoryName.value.trim();
  if (!name) {
    notify("Enter a category name.", "red");
    return;
  }

  isSaving.value = true;
  try {
    await api.post(`${apiBaseUrl}/create-category`, { name }, { withCredentials: true });
    newCategoryName.value = "";
    await loadCategories();
    notify("Category created successfully.", "green");
  } catch (error) {
    notify(error.response?.data?.message || "Could not create the category.", "red");
  } finally {
    isSaving.value = false;
  }
}

function openEditModal(category) {
  editingCategory.value = category;
  editName.value = category.name;
}

function closeEditModal() {
  if (isSaving.value) return;
  editingCategory.value = null;
  editName.value = "";
}

async function saveCategoryEdit() {
  const name = editName.value.trim();
  if (!name) {
    notify("Category name cannot be empty.", "red");
    return;
  }

  isSaving.value = true;
  try {
    await api.put(
      `${apiBaseUrl}/${editingCategory.value._id}`,
      { name },
      { withCredentials: true }
    );
    editingCategory.value = null;
    editName.value = "";
    await loadCategories();
    notify("Category updated successfully.", "green");
  } catch (error) {
    notify(error.response?.data?.message || "Could not update the category.", "red");
  } finally {
    isSaving.value = false;
  }
}

function openDeleteModal(category) {
  deletingCategory.value = category;
}

function closeDeleteModal() {
  if (isDeleting.value) return;
  deletingCategory.value = null;
}

async function confirmDeleteCategory() {
  isDeleting.value = true;
  try {
    await api.delete(
      `${apiBaseUrl}/delete-category/${deletingCategory.value._id}`,
      { withCredentials: true }
    );
    deletingCategory.value = null;
    await loadCategories();
    notify("Category deleted successfully.", "green");
  } catch (error) {
    notify(error.response?.data?.message || "Could not delete the category.", "red");
  } finally {
    isDeleting.value = false;
  }
}

onMounted(loadCategories);
</script>

<template>
  <section class="mx-auto w-full max-w-4xl">
    <h2 class="text-2xl font-semibold text-slate-800 sm:text-3xl">Manage Categories</h2>
    <p class="mt-1 text-sm text-slate-500">Create categories and edit or remove existing ones.</p>

    <form class="mt-6 flex flex-col gap-3 sm:flex-row" @submit.prevent="createCategory">
      <input
        v-model="newCategoryName"
        required
        maxlength="80"
        type="text"
        placeholder="Enter a category name"
        aria-label="New category name"
        class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
      />
      <button
        type="submit"
        :disabled="isSaving"
        class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ isSaving && !editingCategory ? "Creating…" : "Create Category" }}
      </button>
    </form>

    <div class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 sm:px-6">
        <span>Name</span>
        <span>Actions</span>
      </div>

      <p v-if="isLoading" class="px-6 py-8 text-center text-slate-500">Loading categories…</p>
      <p v-else-if="!categories.length" class="px-6 py-8 text-center text-slate-500">No categories yet. Create the first one above.</p>

      <div
        v-for="category in categories"
        :key="category._id"
        class="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:px-6"
      >
        <div class="min-w-0">
          <p class="truncate font-medium text-slate-800">{{ category.name }}</p>
          <p class="truncate text-xs text-slate-500">{{ category.slug }}</p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            @click="openEditModal(category)"
          >Edit</button>
          <button
            type="button"
            class="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100"
            @click="openDeleteModal(category)"
          >Delete</button>
        </div>
      </div>
    </div>

    <div
      v-if="editingCategory"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      @click.self="closeEditModal"
      @keydown.esc="closeEditModal"
    >
      <section class="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-category-title">
        <h3 id="edit-category-title" class="text-xl font-bold text-slate-800">Edit Category</h3>
        <p class="mt-1 text-sm text-slate-500">Update the category name. Its slug will update automatically.</p>
        <form class="mt-5 space-y-5" @submit.prevent="saveCategoryEdit">
          <label class="block space-y-2">
            <span class="font-medium text-slate-700">Category name</span>
            <input v-model="editName" required maxlength="80" autofocus class="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <div class="flex justify-end gap-3">
            <button type="button" :disabled="isSaving" class="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60" @click="closeEditModal">Cancel</button>
            <button type="submit" :disabled="isSaving" class="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{{ isSaving ? "Saving…" : "Save Changes" }}</button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="deletingCategory"
      class="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      @click.self="closeDeleteModal"
      @keydown.esc="closeDeleteModal"
    >
      <section class="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 font-bold text-rose-600">!</div>
        <h3 id="delete-category-title" class="text-xl font-bold text-slate-800">Delete this category?</h3>
        <p class="mt-2 text-sm leading-6 text-slate-500">You’re about to delete <strong class="text-slate-700">{{ deletingCategory.name }}</strong>. This action cannot be undone.</p>
        <div class="mt-7 flex justify-end gap-3">
          <button type="button" :disabled="isDeleting" class="rounded-lg bg-emerald-500 px-4 py-2.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60" @click="closeDeleteModal">Cancel</button>
          <button type="button" :disabled="isDeleting" class="rounded-lg bg-rose-500 px-4 py-2.5 font-semibold text-white hover:bg-rose-600 disabled:opacity-60" @click="confirmDeleteCategory">{{ isDeleting ? "Deleting…" : "Yes, Delete" }}</button>
        </div>
      </section>
    </div>
  </section>
</template>
