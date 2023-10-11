<template>
  <input
    class="border rounded-md p-1 h-8 focus:outline-none focus:border-midnight-900"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
});

defineEmits(["update:modelValue"]);
</script>
