<template>
  <div
    class="flex flex-col bg-space-950 items-center justify-between py-8 text-white"
  >
    <div>
      <NuxtLink to="/dashboard" class="text-xl"> semanti / core </NuxtLink>
    </div>
    <div class="flex flex-col gap-2">
      <NuxtLink to="/datasets/new">
        <div
          class="border hover:bg-white hover:text-space-950 rounded-lg p-2 flex items-center"
        >
          <Icon name="uil:plus" class="w-icon h-icon" />
          <p>New dataset</p>
        </div>
      </NuxtLink>
      <br />
      <NuxtLink
        to="/dashboard"
        :class="route.path === '/dashboard' ? 'font-bold' : undefined"
        class="hover:underline"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/my-datasets"
        :class="route.path === '/my-datasets' ? 'font-bold' : undefined"
        class="hover:underline"
      >
        My datasets
      </NuxtLink>
      <NuxtLink
        to="/browse"
        :class="route.path === '/browse' ? 'font-bold' : undefined"
        class="hover:underline"
      >
        Browse
      </NuxtLink>
    </div>

    <p class="cursor-pointer hover:underline" @click="signOut">Sign out</p>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient();
const route = useRoute();

const signOut = async () => {
  await client.auth.signOut();
  navigateTo("/");
};
</script>
