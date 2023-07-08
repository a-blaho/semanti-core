<template>
  <div class="flex flex-col w-screen h-screen items-center justify-center">
    <h1>Dashboard</h1>
    <Button @click="signOut">Sign out</Button>
  </div>
</template>

<script setup>
const client = useSupabaseAuthClient();

const signOut = async () => {
  await client.auth.signOut();
  navigateTo("/");
};
</script>
