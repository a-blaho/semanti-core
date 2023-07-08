<template>
  <button
    class="border rounded-lg px-8 py-2"
    :class="{
      'bg-transparent text-midnight-blue-900 border-midnight-blue-900 hover:bg-midnight-blue-900 hover:text-white':
        variant === 'outlined',
      'text-white bg-midnight-blue-900 hover:bg-midnight-blue-950':
        variant === 'contained',
    }"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String as PropType<"outlined" | "contained">,
    required: false,
    default: "contained",
  },
});

defineEmits(["click"]);
</script>
