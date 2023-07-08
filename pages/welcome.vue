<template>
  <div
    class="flex flex-col gap-4 w-screen h-screen items-center justify-center"
  >
    <Icon name="uil:github" class="w-32 h-32" />
    <h1 class="text-4xl text-bold">
      Authorization using
      <span class="text-midnight-blue-900"> GitHub </span> was successful
    </h1>
    <div class="flex flex-col items-center justify-center">
      <p class="text-xl">Continue to the dashboard</p>
      <Button @click="$router.push('/dashboard')">Dashboard</Button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "intro",
});
</script>
