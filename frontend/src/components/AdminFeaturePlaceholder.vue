<script setup>
defineProps({
    title: { type: String, required: true },
    description: { type: String, required: true }
});
</script>
<template>
    <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ title }}</h2>
        <div class="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">{{ description
            }} This screen is routed and ready for its backend feature.

        </div>
    </div>
</template>