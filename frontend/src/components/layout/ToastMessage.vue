<script setup>
// import BaseButton from '../BaseButton.vue';
// const emit = defineEmits(['closeToast']);

defineProps({
  text: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  showToast: {
    type: Boolean,
    required: true
  }
});
</script>
<template>
  <div class="toast-container" v-if="showToast" :style="{ backgroundColor: color }">
    <div class="header">
      <h3>{{ text }}</h3>
    </div>
    <!-- <BaseButton text="X" variant="danger" @click="$emit('closeToast')" /> -->
  </div>
</template>
<style scoped>
.toast-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  width: 30%;
  background-color: var(--success-color);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 1px 1px 3px rgba(175, 159, 159, 0.3);
  position: fixed;
  top: 10%;
  right: 20px;
  overflow: hidden;
}

/* .toast-container::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background-color: white;
  transform-origin: left;
  animation: toast-countdown 2s linear forwards;
}

@keyframes toast-countdown {
  to {
    transform: scaleX(0);
  }
}

.toast-container .header {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.toast-container .header>p {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 5px;
  margin: 0;
}

.toast-container button {
  background-color: transparent;
  padding: 5px;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.toast-container button:hover {
  color: black;
} */
</style>