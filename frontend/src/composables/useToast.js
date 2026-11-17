import { ref } from "vue";

const message = ref("");
const color = ref("green");
const visible = ref(false);
let timer;

export function useToast() {
  function notify(text, toastColor, duration = 2500) {
    message.value = text;
    color.value = toastColor;
    visible.value = true;

    clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = false;
    }, duration);
  }

  return { message, color, visible, notify };
}