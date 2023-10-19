<template>
  <select
    class="w-full border rounded-md h-8 p-1 focus:outline-none focus:border-space-900"
    :class="{ 'text-gray-400': modelValue == null }"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    style="
       {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6IzQ0NDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmFycm93czwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNC45NSIgaGVpZ2h0PSIxMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxLjQxIDQuNjcgMi40OCAzLjE4IDMuNTQgNC42NyAxLjQxIDQuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMy41NCA1LjMzIDIuNDggNi44MiAxLjQxIDUuMzMgMy41NCA1LjMzIi8+PC9zdmc+')
            no-repeat 95% 50%,
          white;
      }
    "
  >
    <option v-if="placeholder" disabled selected value>
      {{ placeholder }}
    </option>
    <slot />
  </select>
</template>

<script setup>
defineProps({
  placeholder: {
    type: String,
  },
  name: {
    required: true,
    type: String,
  },
  modelValue: String,
});
</script>
