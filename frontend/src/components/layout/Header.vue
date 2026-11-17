<script setup>
import { ShoppingCart } from "@primeicons/vue";
import { inject, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api.js";
import ModelBox from "../ModelBox.vue";
import { useToast } from "../../composables/useToast.js";
import { useCart } from "../../composables/useCart.js";

const { user, isAuthenticated, clearUser } = inject("auth");
const router = useRouter();
const { notify } = useToast();
const { itemCount } = useCart();
const showUserMenu = ref(false);
const showCategoryMenu = ref(false);
const categoryMenuRef = ref(null);
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);
const categories = ref([]);
const isLoadingCategories = ref(false);
const categoryLoadError = ref("");
const dashboardPathByRole = { customer: "/dashboard/customer", seller: "/dashboard/seller", admin: "/dashboard/admin" };
const apiBaseUrl = `/api/v1`;

async function loadCategories() {
    isLoadingCategories.value = true;
    categoryLoadError.value = "";
    try {
        const response = await api.get(`${apiBaseUrl}/categories/get-categories`);
        categories.value = response.data.data || [];
    } catch (error) {
        categoryLoadError.value = error.response?.data?.message || "Could not load categories.";
    } finally {
        isLoadingCategories.value = false;
    }
}

function closeCategoryMenuOnOutsideClick(event) {
    if (!categoryMenuRef.value?.contains(event.target)) showCategoryMenu.value = false;
}
onMounted(() => {
    loadCategories();
    document.addEventListener("pointerdown", closeCategoryMenuOnOutsideClick);
});
onUnmounted(() => {
    document.removeEventListener("pointerdown", closeCategoryMenuOnOutsideClick);
});

async function logout() {
    if (isLoggingOut.value) return;
    isLoggingOut.value = true;
    try {
        await api.post(`/api/v1/users/logout`, {}, { withCredentials: true });
        clearUser();
        showLogoutModal.value = false;
        await router.push("/");
        notify("Successfully logged out", "green");
    } catch (error) {
        if (error.response?.status === 401) {
            clearUser();
            showLogoutModal.value = false;
            await router.push("/login");
            notify("Your session has expired. Please log in again.", "red");
        } else {
            notify(error.response?.data?.message || "Could not log out. Please try again.", "red");
        }
    } finally {
        isLoggingOut.value = false;
    }
}
function confirmLogout() {
    showUserMenu.value = false;
    showLogoutModal.value = true;
}
</script>

<template>
    <header class="bg-gray-800 p-4 text-white">
        <main class="container mx-auto flex items-center justify-between">
            <RouterLink to="/" class="flex items-center space-x-2">
                <ShoppingCart class="h-6 w-6" /><span class="text-lg font-bold">ECOMMERCE STORE</span>
            </RouterLink>
            <nav class="flex items-center gap-4 font-medium">
                <RouterLink to="/" class="nav-link">HOME</RouterLink>
                <div ref="categoryMenuRef" class="relative" @mouseenter="showCategoryMenu = true" @mouseleave="showCategoryMenu = false">
                    <button type="button" class="nav-link flex items-center gap-1" aria-haspopup="true"
                        :aria-expanded="showCategoryMenu" @click="showCategoryMenu = !showCategoryMenu">
                        CATEGORIES <span aria-hidden="true">▾</span>
                    </button>
                    <div v-if="showCategoryMenu"
                        class="absolute left-0 top-full z-40 max-h-80 w-44 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm font-medium text-slate-700 shadow-xl">
                        <RouterLink to="/category" class="block px-3 py-2 uppercase transition hover:bg-blue-50 hover:text-blue-700"
                            @click="showCategoryMenu = false">All Categories</RouterLink>
                        <div class="my-1 border-t border-slate-100"></div>
                        <p v-if="isLoadingCategories" class="px-3 py-2 text-slate-500">Loading…</p>
                        <p v-else-if="categoryLoadError" class="px-3 py-2 text-rose-600">{{ categoryLoadError }}</p>
                        <p v-else-if="!categories.length" class="px-3 py-2 text-slate-500">No categories yet</p>
                        <RouterLink v-for="category in categories" :key="category._id"
                            :to="`/category/${encodeURIComponent(category.slug)}`"
                            class="block px-3 py-2 uppercase transition hover:bg-blue-50 hover:text-blue-700"
                            @click="showCategoryMenu = false">{{ category.name }}</RouterLink>
                    </div>
                </div>
                <template v-if="!isAuthenticated">
                    <RouterLink to="/register" class="nav-link">REGISTER</RouterLink>
                    <RouterLink to="/login" class="nav-link">LOGIN</RouterLink>
                </template>
                <div v-else class="relative" @mouseenter="showUserMenu = true" @mouseleave="showUserMenu = false">
                    <button type="button"
                        class="nav-link flex items-center gap-1 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        aria-haspopup="true" :aria-expanded="showUserMenu" @click="showUserMenu = true">
                        {{ user?.name || "USER" }} <span aria-hidden="true">▾</span>
                    </button>
                    <div v-if="showUserMenu"
                        class="absolute right-0 top-full z-40 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xl">
                        <RouterLink class="block px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700"
                            :to="dashboardPathByRole[user?.role] || '/dashboard'" @click="showUserMenu = false">
                            Dashboard</RouterLink>
                        <button type="button"
                            class="block w-full px-4 py-3 text-left transition hover:bg-rose-50 hover:text-rose-700"
                            @click="confirmLogout">Logout</button>
                    </div>
                </div>
                <RouterLink to="/cart" class="nav-link">CART ({{ itemCount }})</RouterLink>
            </nav>
        </main>
        <ModelBox v-if="showLogoutModal" :loading="isLoggingOut" @cancel="showLogoutModal = false" @confirm="logout" />
    </header>
</template>
<style scoped>
.nav-link {
    position: relative;
    cursor: pointer;
}

.nav-link::after {
    content: "";
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -5px;
    left: 0;
    background: white;
    transition: width .25s ease-in-out;
}

.nav-link:hover::after {
    width: 100%;
}
</style>