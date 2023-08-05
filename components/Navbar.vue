<template>
  <div
    class="px-4 flex fixed top-0 left-0 h-16 w-screen bg-midnight-blue-950 items-center justify-between"
  >
    <p class="text-white">semanti/core</p>
    <Input
      class="w-96"
      name="search"
      placeholder="Search datasets"
      type="text"
      v-model="search"
    />
    <HeadlessMenu>
      <HeadlessMenuButton class="relative">
        <Icon
          @click="console.log('hello')"
          name="mdi:person"
          class="h-12 w-12 text-white cursor-pointer border rounded-full p-1"
        />
      </HeadlessMenuButton>
      <HeadlessMenuItems class="absolute right-0 top-12">
        <div
          class="bg-white border-midnight-blue-900 p-4 border rounded-md m-4 text-midnight-blue-900"
        >
          <HeadlessMenuItem>
            <p>{{ user?.email }}</p>
          </HeadlessMenuItem>
          <hr class="my-2" />
          <HeadlessMenuItem :class="menuItemClass">
            <p>Profile</p>
          </HeadlessMenuItem>
          <HeadlessMenuItem :class="menuItemClass">
            <p>Settings</p>
          </HeadlessMenuItem>
          <HeadlessMenuItem :class="menuItemClass"
            ><p @click="signOut">Log out</p>
          </HeadlessMenuItem>
        </div>
      </HeadlessMenuItems>
    </HeadlessMenu>
  </div>
</template>

<script setup lang="ts">
const { auth } = useSupabaseAuthClient();
const user = useSupabaseUser();

const signOut = async () => {
  await auth.signOut();
  navigateTo("/");
};

const menuItemClass =
  "hover:bg-midnight-blue-950 hover:cursor-pointer hover:text-white rounded p-2";

const search = ref("");
</script>
