<script setup lang="ts">
import { cn } from "@/lib/utils";
import { Primitive, type PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { type ButtonVariants, buttonVariants } from ".";

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  asChild: false,
  disabled: false,
});

// Explicitly compute disabled state to ensure consistency
const isDisabled = computed(() => Boolean(props.disabled));
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :disabled="isDisabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
