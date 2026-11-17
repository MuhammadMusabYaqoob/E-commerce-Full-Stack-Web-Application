<script setup>
import { inject } from "vue";
const { user } = inject("auth");
</script>
<template>
  <div><h2 class="text-2xl font-semibold text-slate-800">Your account</h2>
    <div class="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-lg text-slate-700">
      <p><span class="font-semibold">Name:</span> {{ user?.name }}</p><p><span class="font-semibold">Email:</span> {{ user?.email }}</p>
    </div><p class="mt-5 text-sm text-slate-500">Use the menu to view your profile or orders.</p>
  </div>
</template>