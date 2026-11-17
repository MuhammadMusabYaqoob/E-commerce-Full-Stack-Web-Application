<script setup>
import api from "../../services/api.js";
import { onMounted, ref } from "vue";

const orders = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, totalOrders: 0 });
const isLoading = ref(true);
const loadError = ref("");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

async function loadOrders(page = 1) {
  isLoading.value = true;
  loadError.value = "";
  try {
    const response = await api.get(`/api/v1/orders/admin/orders`, {
      params: { page },
      withCredentials: true,
    });
    orders.value = response.data.data.orders || [];
    pagination.value = response.data.data.pagination;
  } catch (error) {
    loadError.value = error.response?.data?.message || "Could not load orders.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => loadOrders());
</script>

<template>
  <section>
    <h2 class="text-2xl font-semibold text-slate-800">Orders</h2>
    <p class="mt-1 text-sm text-slate-500">All customer orders: {{ pagination.totalOrders }}</p>
    <div v-if="isLoading" class="mt-5 rounded-xl bg-slate-50 p-8 text-center text-slate-500">Loading orders…</div>
    <div v-else-if="loadError" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{{ loadError }}</div>
    <div v-else-if="!orders.length" class="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No orders have been placed yet.</div>
    <div v-else class="mt-5 space-y-4">
      <article v-for="order in orders" :key="order._id" class="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:p-5">
          <div>
            <h3 class="font-semibold text-slate-800">Order #{{ order._id.slice(-8).toUpperCase() }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ dateFormat.format(new Date(order.createdAt)) }}</p>
            <p class="mt-2 text-sm text-slate-600">Customer: {{ order.user?.name || "Account unavailable" }} <span v-if="order.user?.email">· {{ order.user.email }}</span></p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-slate-900">{{ currency.format(order.total) }}</p>
            <p class="mt-1 text-xs capitalize text-slate-600">{{ order.orderStatus }} · payment {{ order.paymentStatus }}</p>
          </div>
        </header>
        <ul class="divide-y divide-slate-100 px-4 sm:px-5">
          <li v-for="item in order.items" :key="`${order._id}-${item.product}`" class="flex items-center gap-3 py-3 text-sm">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="h-14 w-14 shrink-0 rounded-lg bg-slate-50 object-contain p-1" />
            <div v-else class="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-400">No image</div>
            <span class="min-w-0 grow text-slate-700">{{ item.name }} <span class="text-slate-400">× {{ item.quantity }}</span></span>
            <span class="shrink-0 font-medium text-slate-800">{{ currency.format(item.lineTotal) }}</span>
          </li>
        </ul>
        <footer class="border-t border-slate-100 px-4 py-4 text-sm text-slate-600 sm:px-5">
          <span class="font-semibold">Delivery:</span> {{ order.shippingAddress.name }} · {{ order.shippingAddress.phone }} · {{ order.shippingAddress.address }}
        </footer>
      </article>
      <nav v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-4 pt-2" aria-label="Order pages">
        <button type="button" :disabled="pagination.currentPage <= 1 || isLoading" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="loadOrders(pagination.currentPage - 1)">Previous</button>
        <span class="text-sm text-slate-600">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
        <button type="button" :disabled="pagination.currentPage >= pagination.totalPages || isLoading" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="loadOrders(pagination.currentPage + 1)">Next</button>
      </nav>
    </div>
  </section>
</template>