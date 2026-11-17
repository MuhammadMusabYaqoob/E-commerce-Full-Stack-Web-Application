<script setup>
import { inject, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const { user } = inject("auth");
const router = useRouter();
const seconds = ref(3);
let countdown;
const destinationByRole = {
    customer: "/dashboard/customer",
    seller: "/dashboard/seller",
    admin: "/dashboard/admin",
};

onMounted(() => {
    countdown = window.setInterval(() => {
        seconds.value -= 1;
        if (seconds.value <= 0) {
            window.clearInterval(countdown);
            router.replace(destinationByRole[user.value?.role] || "/dashboard/customer");
        }
    }, 1000);
});
onUnmounted(() => window.clearInterval(countdown));
</script>

<template>
    <section class="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-6 text-center">
        <div class="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl sm:p-12">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Dashboard</p>
            <h1 class="mt-3 text-2xl font-bold text-slate-800">Taking you to your dashboard</h1>
            <p class="mt-3 text-slate-600">Redirecting you in <strong class="text-blue-600">{{ seconds }}</strong>
                seconds…</p>
        </div>
    </section>
</template>