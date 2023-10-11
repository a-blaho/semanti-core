<template>
  <button
    :disabled="loading"
    class="border rounded-lg px-8 py-2 disabled:opacity-50 flex items-center justify-center gap-2 transition"
    :class="{
      'bg-transparent text-midnight-900 border-midnight-900 hover:bg-midnight-900 hover:text-midnight-50 disabled:hover:bg-transparent disabled:hover:text-midnight-900':
        variant === 'outlined',
      'text-midnight-50 bg-midnight-900 hover:bg-midnight-950 disabled:hover:bg-midnight-900':
        variant === 'contained',
    }"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-2">
      <Loading v-if="false" />
      <slot />
      <Loading v-if="loading" />
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
