<script setup>
import { inject, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const { user } = inject("auth");
const route = useRoute();
const router = useRouter();
const productsSectionOpen = ref(route.path.startsWith("/dashboard/admin/products"));

function toggleProductsSection() {
  productsSectionOpen.value = !productsSectionOpen.value;
  if (productsSectionOpen.value && !route.path.startsWith("/dashboard/admin/products")) {
    router.push("/dashboard/admin/products");
  }
}

watch(() => route.path, (path) => {
  productsSectionOpen.value = path.startsWith("/dashboard/admin/products");
});
</script>

<template>
  <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[230px_1fr]">
    <aside class="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h1 class="border-b border-slate-200 px-5 py-4 text-xl font-bold text-slate-800">Admin Panel</h1>
      <RouterLink class="dashboard-link" to="/dashboard/admin">Overview</RouterLink>
      <RouterLink class="dashboard-link" to="/dashboard/admin/categories/new">Create Category</RouterLink>

      <div>
        <button
          type="button"
          class="dashboard-link flex w-full items-center justify-between text-left"
          :class="{ 'dashboard-link-active': productsSectionOpen }"
          :aria-expanded="productsSectionOpen"
          aria-controls="admin-products-submenu"
          @click="toggleProductsSection"
        >
          <span>Products</span>
          <svg class="h-4 w-4 transition-transform" :class="{ 'rotate-180': productsSectionOpen }" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
          </svg>
        </button>
        <div v-show="productsSectionOpen" id="admin-products-submenu" class="products-submenu">
          <RouterLink class="dashboard-link dashboard-sub-link" to="/dashboard/admin/products">All Products</RouterLink>
          <RouterLink class="dashboard-link dashboard-sub-link" to="/dashboard/admin/products/new">Add Product</RouterLink>
        </div>
      </div>

      <RouterLink class="dashboard-link" to="/dashboard/admin/orders">Orders</RouterLink>
      <RouterLink class="dashboard-link" to="/dashboard/admin/users">Users</RouterLink>
    </aside>
    <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="mb-5 text-sm text-slate-500">Administrator: {{ user?.name || "Admin" }}</p><RouterView />
    </section>
  </div>
</template>

<style scoped>
a.dashboard-link { display: block; }
.dashboard-link { border: 0; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; color: #334155; transition: background-color .2s, color .2s; }
button.dashboard-link { display: flex; }
.dashboard-link:hover { background: #f8fafc; color: #334155; }
.dashboard-link.router-link-exact-active, .dashboard-link-active { background: #eff6ff; color: #2563eb; }
.dashboard-sub-link { padding-left: 34px; font-size: .9rem; background: #f8fafc; }
.dashboard-sub-link.router-link-exact-active { background: #eff6ff; color: #2563eb; }
.products-submenu { border-bottom: 1px solid #e2e8f0; }
.dashboard-link:focus-visible { outline: 2px solid #3b82f6; outline-offset: -2px; }
</style>




