
<template>
    <main class="auth-background min-h-screen">
        <div class="auth-card">
            <slot></slot>
        </div>
    </main>
</template>
<style scoped>
.auth-background {
    background-color: #ffdee9;
    background-image: linear-gradient(0deg, #ffdee9 0%, #b5fffc 100%);
}
</style>