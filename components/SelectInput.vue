<template>
  <select
    class="w-full border rounded-md h-8 p-1 focus:outline-none focus:border-midnight-blue-900"
    :class="{ 'text-gray-400': modelValue == null }"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  >
    <option disabled selected value>{{ placeholder }}</option>
    <slot />
  </select>
</template>

<script setup>
defineProps({
  placeholder: {
    required: true,
    type: String,
  },
  name: {
    required: true,
    type: String,
  },
  modelValue: String,
});
</script>
