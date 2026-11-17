<script setup>

defineProps({
  label:{
    type: String,
    required: true,
    default: ""
  },
  type:{
    type: String,
    default: 'text'
  },
  placeholder:{
    type: String,
  },
  maxLength:{
    type: Number,
    default: 50
  },
  required: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: ""
  }
})

const emit = defineEmits(['update:modelValue'])
// @input = "emit('update:modelValue', $event.target.value)"
// :value="modelValue"

</script>

<template>
  <label class="flex flex-col gap-1">
    
    <span class="text-sm sm:text-lg font-semibold text-slate-500 flex items-center gap-2"><slot></slot> {{ label }}</span>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('update:modelValue', $event.target.value)"
      :required="required"
      :maxlength="maxLength"
      :type="type"
      :placeholder="placeholder"
      class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10"
    />
  </label>
</template>
