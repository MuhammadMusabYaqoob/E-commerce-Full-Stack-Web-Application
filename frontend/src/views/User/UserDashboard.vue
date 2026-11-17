<script setup>
import { inject } from "vue";
const { user } = inject("auth");
</script>
<template>
  <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[230px_1fr]">
    <aside class="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h1 class="border-b border-slate-200 px-5 py-4 text-xl font-bold text-slate-800">Dashboard</h1>
      <RouterLink class="dashboard-link" to="/dashboard/customer">Overview</RouterLink>
      <RouterLink class="dashboard-link" to="/dashboard/customer/profile">Profile</RouterLink>
      <RouterLink class="dashboard-link" to="/dashboard/customer/orders">Orders</RouterLink>
    </aside>
    <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="mb-5 text-sm text-slate-500">Welcome, {{ user?.name || "Customer" }}</p>
      <RouterView />
    </section>
  </div>
</template>
<style scoped>
.dashboard-link { display: block; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; color: #334155; transition: background-color .2s, color .2s; }
.dashboard-link:hover { background: #f8fafc; color: #334155; }
.dashboard-link.router-link-exact-active { background: #eff6ff; color: #2563eb; }
.dashboard-link:focus-visible { outline: 2px solid #3b82f6; outline-offset: -2px; }
</style>