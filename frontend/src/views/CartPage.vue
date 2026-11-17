<script setup>
import { computed } from "vue";
import { useCart } from "../composables/useCart.js";

const { items, itemCount, subtotal, removeFromCart, setQuantity } = useCart();
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const hasItems = computed(() => items.value.length > 0);
</script>

<template>
  <main class="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-slate-900">
      Your Cart <span class="text-lg font-medium text-slate-500">({{ itemCount }})</span>
    </h1>

    <div v-if="!hasItems" class="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p class="text-lg font-semibold text-slate-700">Your cart is empty</p>
      <RouterLink to="/" class="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
        Continue shopping
      </RouterLink>
    </div>

    <div v-else class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <section aria-label="Cart items" class="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4 sm:px-5">
        <article v-for="item in items" :key="item.product._id" class="flex flex-wrap items-center gap-4 py-5 sm:flex-nowrap">
          <img
            v-if="item.product.images?.[0]?.url"
            :src="item.product.images[0].url"
            :alt="item.product.name"
            class="h-24 w-24 shrink-0 rounded-lg bg-slate-50 object-contain p-2"
          />
          <div class="min-w-0 grow">
            <h2 class="truncate font-semibold text-slate-800">{{ item.product.name }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ currency.format(Number(item.product.price) || 0) }} each</p>
            <button type="button" class="mt-2 text-sm font-medium text-rose-600 hover:text-rose-700" @click="removeFromCart(item.product._id)">
              Remove
            </button>
          </div>
          <label class="flex shrink-0 items-center gap-2 text-sm text-slate-600">
            Qty
            <input
              :value="item.quantity"
              type="number"
              min="1"
              max="99"
              :aria-label="`Quantity for ${item.product.name}`"
              class="w-20 rounded-md border border-slate-300 px-2 py-1.5"
              @change="setQuantity(item.product._id, $event.target.value)"
            />
          </label>
          <strong class="ml-auto min-w-24 text-right text-slate-800">
            {{ currency.format((Number(item.product.price) || 0) * item.quantity) }}
          </strong>
        </article>
      </section>

      <aside class="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6" aria-label="Cart summary">
        <h2 class="text-xl font-semibold text-slate-900">Cart Summary</h2>
        <p class="mt-1 text-sm text-slate-500">{{ itemCount }} item(s) in your cart</p>
        <div class="my-5 border-t border-slate-200"></div>
        <div class="flex justify-between gap-4 text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{{ currency.format(subtotal) }}</span>
        </div>
        <div class="mt-3 flex justify-between gap-4 text-sm text-slate-600">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div class="my-5 border-t border-slate-200"></div>
        <div class="flex justify-between gap-4 text-lg font-bold text-slate-900">
          <span>Total</span>
          <span>{{ currency.format(subtotal) }}</span>
        </div>
        <p class="mt-2 text-xs leading-5 text-slate-500">Payment is not collected yet. Shipping costs will be added later.</p>
        <RouterLink to="/checkout" class="mt-5 inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Proceed to checkout
        </RouterLink>
        <RouterLink to="/" class="mt-3 inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Continue shopping
        </RouterLink>
      </aside>
    </div>
  </main>
</template>