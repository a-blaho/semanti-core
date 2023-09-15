<template>
  <div
    class="flex flex-col fixed top-0 left-0 h-screen w-48 bg-midnight-blue-900 items-center justify-between py-8 text-white"
  >
    <div @mouseover="hover = true" @mouseout="hover = false">
      <NuxtLink to="/dashboard" class="text-xl"
        >semanti
        <span :class="{ 'text-midnight-blue-500': hover }">/</span>
        core</NuxtLink
      >
    </div>
    <div class="flex flex-col gap-2">
      <NuxtLink to="/new-dataset">New dataset</NuxtLink>
      <br />
      <NuxtLink to="/dashboard">Home</NuxtLink>
      <p>My datasets</p>
      <p>Shared with me</p>
      <p>Browse</p>
    </div>

    <p>Settings</p>
  </div>
</template>

<script setup lang="ts">
const hover = ref(false);
</script>
