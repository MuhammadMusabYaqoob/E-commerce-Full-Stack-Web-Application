<script setup>
const emit = defineEmits(['close'])
defineProps({
    text:{
        type: String,
        required: true
    },
    type:{
        type: String,
        default: "button",
        // required: true
    },
    variant: {
        type: String,
        default: "primary"
    }
})

// function getButtonClasses() {
//     if (variant === "primary") {
//         return "bg-blue-500 text-white p-2 rounded"
//     } else if (variant === "secondary") {
//         return "bg-gray-500 text-white p-2 rounded"
//     } else if (variant === "danger") {
//         return "bg-red-500 text-white p-2 rounded"
//     } else {
//         return "bg-blue-500 text-white p-2 rounded"
//     }
// }
</script>

<template>
    <button
    :type="type"
    :class="variant === 'primary' ? 'bg-blue-500 text-white p-2 rounded' : 'bg-gray-500 text-white p-2 rounded'"
    :@click="emit('close')"
    >{{text}}
    </button>
</template>
<style scoped></style>