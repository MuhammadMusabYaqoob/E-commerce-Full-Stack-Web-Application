<script setup>
import api from "../../services/api.js";
import { onMounted, ref } from "vue";
import { useToast } from "../../composables/useToast.js";

const { notify } = useToast();
const orders = ref([]);
const isLoading = ref(true);
const loadError = ref("");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

async function loadOrders() {
  isLoading.value = true;
  loadError.value = "";
  try {
    const response = await api.get(`/api/v1/orders/my-orders`, { withCredentials: true });
    orders.value = response.data.data.orders || [];
  } catch (error) {
    loadError.value = error.response?.data?.message || "Could not load your orders.";
    notify(loadError.value, "red");
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadOrders);
</script>

<template>
  <section>
    <h2 class="text-2xl font-semibold text-slate-800">My Orders</h2>
    <p class="mt-1 text-sm text-slate-500">Orders you place will appear here.</p>
    <div v-if="isLoading" class="mt-5 rounded-xl bg-slate-50 p-8 text-center text-slate-500">Loading your orders…</div>
    <div v-else-if="loadError" class="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{{ loadError }}</div>
    <div v-else-if="!orders.length" class="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">You haven’t placed any orders yet.</div>
    <div v-else class="mt-5 space-y-5">
      <article v-for="order in orders" :key="order._id" class="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div><h3 class="font-semibold text-slate-800">Order #{{ order._id.slice(-8).toUpperCase() }}</h3><p class="mt-1 text-xs text-slate-500">{{ dateFormat.format(new Date(order.createdAt)) }}</p></div>
          <div class="text-right"><p class="font-bold text-slate-900">{{ currency.format(order.total) }}</p><p class="mt-1 text-xs capitalize text-slate-500">{{ order.orderStatus }} · payment {{ order.paymentStatus }}</p></div>
        </header>
        <ul class="divide-y divide-slate-100 px-5">
          <li v-for="item in order.items" :key="`${order._id}-${item.product}`" class="flex items-center gap-3 py-4">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="h-14 w-14 rounded-lg bg-slate-50 object-contain p-1" />
            <div class="min-w-0 grow"><p class="truncate font-medium text-slate-800">{{ item.name }}</p><p class="mt-1 text-sm text-slate-500">{{ currency.format(item.unitPrice) }} × {{ item.quantity }}</p></div>
            <strong class="text-sm text-slate-800">{{ currency.format(item.lineTotal) }}</strong>
          </li>
        </ul>
        <footer class="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
          <span class="font-semibold">Deliver to:</span> {{ order.shippingAddress.name }}, {{ order.shippingAddress.address }}
        </footer>
      </article>
    </div>
  </section>
</template>