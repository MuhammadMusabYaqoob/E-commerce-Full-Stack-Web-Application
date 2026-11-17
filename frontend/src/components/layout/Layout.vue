<script setup>
import { RouterView } from "vue-router";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
</script>

<template>
  <div class="layout flex flex-col min-h-screen">
    <Header />

    <main class="grow">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>