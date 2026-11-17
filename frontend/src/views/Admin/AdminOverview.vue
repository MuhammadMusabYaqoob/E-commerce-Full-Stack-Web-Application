<script setup>
import { inject } from "vue";
const { user } = inject("auth");
</script>
<template><div><h2 class="text-2xl font-semibold text-slate-800">Admin dashboard</h2>
  <div class="mt-5 space-y-3 rounded-xl border border-slate-200 p-6 text-lg text-slate-700">
    <p><span class="font-semibold">Admin name:</span> {{ user?.name }}</p><p><span class="font-semibold">Admin email:</span> {{ user?.email }}</p><p v-if="user?.phone"><span class="font-semibold">Admin contact:</span> {{ user.phone }}</p>
  </div></div></template>