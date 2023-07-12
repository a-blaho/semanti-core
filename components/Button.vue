<template>
  <button
    :disabled="loading"
    class="border rounded-lg px-8 py-2 disabled:opacity-50 flex items-center justify-center gap-2 transition"
    :class="{
      'bg-transparent text-midnight-blue-900 border-midnight-blue-900 hover:bg-midnight-blue-900 hover:text-white disabled:hover:bg-transparent disabled:hover:text-midnight-blue-900':
        variant === 'outlined',
      'text-white bg-midnight-blue-900 hover:bg-midnight-blue-950 disabled:hover:bg-midnight-blue-900':
        variant === 'contained',
    }"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-2">
      <Loading class="invisible" />
      <slot />
      <Loading :class="{ invisible: !loading }" />
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
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);
</script>
