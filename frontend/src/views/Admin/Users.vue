<script setup>
import api from "../../services/api.js";
import { onMounted, ref } from "vue";

const users = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalUsers: 0 });
const roleCounts = ref({ customer: 0, admin: 0, seller: 0 });
const isLoading = ref(true);
const loadError = ref("");
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

async function loadUsers(page = 1) {
  isLoading.value = true;
  loadError.value = "";
  try {
    const response = await api.get(`/api/v1/users/admin/users`, {
      params: { page },
      withCredentials: true,
    });
    users.value = response.data.data.users || [];
    pagination.value = response.data.data.pagination;
    roleCounts.value = response.data.data.roleCounts || { customer: 0, admin: 0, seller: 0 };
  } catch (error) {
    loadError.value = error.response?.data?.message || "Could not load users.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => loadUsers());
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">Users</h2>
        <p class="mt-1 text-sm text-slate-500">Registered accounts: {{ pagination.totalUsers }}</p>
      </div>
    </div>

    <div v-if="!isLoading && !loadError" class="mt-5 grid gap-3 sm:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-blue-50 p-4"><p class="text-sm font-medium text-blue-700">Customers</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ roleCounts.customer }}</p></article>
      <article class="rounded-xl border border-slate-200 bg-violet-50 p-4"><p class="text-sm font-medium text-violet-700">Admins</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ roleCounts.admin }}</p></article>
      <article class="rounded-xl border border-slate-200 bg-emerald-50 p-4"><p class="text-sm font-medium text-emerald-700">Sellers</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ roleCounts.seller }}</p></article>
    </div>

    <div v-if="isLoading" class="mt-5 rounded-xl bg-slate-50 p-8 text-center text-slate-500">Loading users…</div>
    <div v-else-if="loadError" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{{ loadError }}</div>
    <div v-else-if="!users.length" class="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">There are no registered users yet.</div>

    <div v-else class="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th class="px-4 py-3 font-semibold">Name</th><th class="px-4 py-3 font-semibold">Email</th><th class="px-4 py-3 font-semibold">Phone</th><th class="px-4 py-3 font-semibold">Role</th><th class="px-4 py-3 font-semibold">Joined</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-for="account in users" :key="account._id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{{ account.name }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ account.email }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ account.phone || "—" }}</td>
              <td class="whitespace-nowrap px-4 py-3"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">{{ account.role }}</span></td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-500">{{ account.createdAt ? dateFormat.format(new Date(account.createdAt)) : "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 border-t border-slate-200 bg-white p-4" aria-label="Users pages">
        <button type="button" :disabled="pagination.currentPage <= 1 || isLoading" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="loadUsers(pagination.currentPage - 1)">Previous</button>
        <span class="text-sm text-slate-600">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
        <button type="button" :disabled="pagination.currentPage >= pagination.totalPages || isLoading" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="loadUsers(pagination.currentPage + 1)">Next</button>
      </nav>
    </div>
  </section>
</template>