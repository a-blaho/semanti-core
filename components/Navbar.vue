<template>
  <div
    class="flex flex-col bg-midnight-900 items-center justify-between py-8 text-midnight-50"
  >
    <div @mouseover="hover = true" @mouseout="hover = false">
      <NuxtLink to="/dashboard" class="text-xl"
        >semanti
        <span :class="{ 'text-midnight-500': hover }">/</span>
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
      <NuxtLink
        to="/dashboard"
        :class="route.path === '/dashboard' ? 'font-bold' : undefined"
        class="hover:underline"
        >Dashboard</NuxtLink
      >
      <NuxtLink
        to="/my-datasets"
        :class="route.path === '/my-datasets' ? 'font-bold' : undefined"
        class="hover:underline"
        >My datasets</NuxtLink
      >
      <p>Shared with me</p>
      <p>Browse</p>
    </div>

    <p class="cursor-pointer hover:underline" @click="signOut">Sign out</p>
  </div>
</template>

<script setup lang="ts">
const hover = ref(false);

const client = useSupabaseClient();
const route = useRoute();

const signOut = async () => {
  await client.auth.signOut();
  navigateTo("/");
};
</script>
