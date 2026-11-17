<script setup>
import api from "../services/api.js";
import { computed, inject, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useCart } from "../composables/useCart.js";
import { useToast } from "../composables/useToast.js";

const router = useRouter();
const { user } = inject("auth");
const { items, subtotal, clearCart } = useCart();
const { notify } = useToast();
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const isSubmitting = ref(false);
const hasItems = computed(() => items.value.length > 0);
const form = reactive({
  name: user.value?.name || "",
  email: user.value?.email || "",
  phone: user.value?.phone || "",
  address: user.value?.address || "",
});

async function placeOrder() {
  if (!hasItems.value) {
    notify("Your cart is empty.", "red");
    return;
  }
  if (![form.name, form.email, form.phone, form.address].every((value) => value.trim())) {
    notify("Complete all delivery fields before placing your order.", "red");
    return;
  }
  isSubmitting.value = true;
  try {
    const response = await api.post(
      `/api/v1/orders/place-order`,
      {
        items: items.value.map(({ product, quantity }) => ({ productId: product._id, quantity })),
        shippingAddress: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      },
      { withCredentials: true }
    );
    clearCart();
    notify(response.data.message || "Order placed. Payment is not collected yet.", "green");
    await router.push("/dashboard/customer/orders");
  } catch (error) {
    notify(error.response?.data?.message || "Could not place your order. Please try again.", "red");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="mx-auto min-h-[60vh] w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <RouterLink to="/cart" class="text-sm font-medium text-blue-600 hover:text-blue-700">← Back to cart</RouterLink>
    <h1 class="mt-3 text-3xl font-bold text-slate-900">Checkout</h1>
    <p class="mt-2 text-sm text-slate-600">Review your delivery details and place the order. You will not be charged yet.</p>

    <div v-if="!hasItems" class="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p class="font-semibold text-slate-700">Your cart is empty.</p>
      <RouterLink to="/" class="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">Continue shopping</RouterLink>
    </div>

    <form v-else class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" @submit.prevent="placeOrder">
      <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="text-xl font-semibold text-slate-900">Delivery details</h2>
        <p class="mt-1 text-sm text-slate-500">You can use a different delivery address for this order.</p>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-medium text-slate-700">Recipient name
            <input v-model="form.name" required autocomplete="name" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label class="text-sm font-medium text-slate-700">Email
            <input v-model="form.email" required type="email" autocomplete="email" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label class="text-sm font-medium text-slate-700 sm:col-span-2">Phone
            <input v-model="form.phone" required type="tel" autocomplete="tel" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label class="text-sm font-medium text-slate-700 sm:col-span-2">Delivery address
            <textarea v-model="form.address" required rows="3" autocomplete="street-address" class="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"></textarea>
          </label>
        </div>
      </section>

      <aside class="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
        <h2 class="text-xl font-semibold text-slate-900">Order summary</h2>
        <ul class="mt-4 divide-y divide-slate-100">
          <li v-for="item in items" :key="item.product._id" class="flex justify-between gap-4 py-3 text-sm">
            <span class="min-w-0 text-slate-600">{{ item.product.name }} <span class="text-slate-400">× {{ item.quantity }}</span></span>
            <span class="shrink-0 font-medium text-slate-800">{{ currency.format((Number(item.product.price) || 0) * item.quantity) }}</span>
          </li>
        </ul>
        <div class="my-4 border-t border-slate-200"></div>
        <div class="flex justify-between font-bold text-slate-900"><span>Total</span><span>{{ currency.format(subtotal) }}</span></div>
        <p class="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Payment is not collected yet. A payment gateway can be connected later.</p>
        <button type="submit" :disabled="isSubmitting" class="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
          {{ isSubmitting ? "Placing order…" : "Place order" }}
        </button>
      </aside>
    </form>
  </main>
</template>