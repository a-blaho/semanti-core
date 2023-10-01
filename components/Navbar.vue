<template>
  <div class="flex flex-col h-screen w-48 bg-midnight-blue-900 items-center justify-between py-8 text-midnight-blue-50">
    <div @mouseover="hover = true" @mouseout="hover = false">
      <NuxtLink to="/dashboard" class="text-xl">semanti
        <span :class="{ 'text-midnight-blue-500': hover }">/</span>
        core
      </NuxtLink>
    </div>
    <div class="flex flex-col gap-2">
      <NuxtLink to="/datasets/new">
        <div class="border rounded-lg p-2 flex items-center">
          <Icon name="uil:plus" class="w-icon h-icon" />
          <p>New dataset</p>
        </div>
      </NuxtLink>
      <br />
      <NuxtLink to="/dashboard">Home</NuxtLink>
      <NuxtLink to="/datasets">My datasets</NuxtLink>
      <p>Shared with me</p>
      <p>Browse</p>
    </div>

    <p>Settings</p>
  </div>
</template>

<script setup lang="ts">
const hover = ref(false);
</script>
