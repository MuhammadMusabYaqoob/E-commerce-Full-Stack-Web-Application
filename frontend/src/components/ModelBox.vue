<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
    role="presentation"
    @click.self="$emit('cancel')"
  >
    <section
      class="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      aria-describedby="logout-description"
    >
      <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <span class="text-xl font-bold">!</span>
      </div>

      <h2 id="logout-title" class="text-xl font-bold text-slate-800">
        Are you sure you want to log out?
      </h2>
      <p id="logout-description" class="mt-2 text-sm leading-6 text-slate-500">
        You can sign in again whenever you are ready.
      </p>

      <div class="mt-7 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg bg-emerald-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          No
        </button>
        <button
          type="button"
          class="rounded-lg bg-rose-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ loading ? "Logging out…" : "Yes" }}
        </button>
      </div>
    </section>
  </div>
</template>