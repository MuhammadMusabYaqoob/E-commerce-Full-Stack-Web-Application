<script setup>
import ToastMessage from "./components/layout/ToastMessage.vue";
import { useToast } from "./composables/useToast.js";
import { computed, provide, ref } from "vue";

const AUTH_USER_STORAGE_KEY = "authUser";
function readSavedUser() {
  try {
    const savedUser = JSON.parse(localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
    if (!savedUser || typeof savedUser !== "object") return null;
    return {
      id: savedUser.id ?? savedUser._id ?? null,
      name: savedUser.name ?? "",
      email: savedUser.email ?? "",
      phone: savedUser.phone ?? "",
      address: savedUser.address ?? "",
      role: !savedUser.role || savedUser.role === "user" ? "customer" : savedUser.role,
    };
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

const user = ref(readSavedUser());
const isAuthenticated = computed(() => Boolean(user.value));
provide("auth", {
  user,
  isAuthenticated,
  setUser(userData) {
    const savedUser = {
      id: userData?._id ?? userData?.id ?? null,
      name: userData?.name ?? "",
      email: userData?.email ?? "",
      phone: userData?.phone ?? "",
      address: userData?.address ?? "",
      role: !userData?.role || userData.role === "user" ? "customer" : userData.role,
    };
    user.value = savedUser;
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(savedUser));
  },
  clearUser() {
    user.value = null;
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  },
});
const { message, color, visible } = useToast();
</script>

<template>
  <RouterView />
  <ToastMessage :text="message" :color="color" :show-toast="visible" />
</template>