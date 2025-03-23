<script setup lang="ts">
import { Button, type ButtonVariants } from "~/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";

const client = useSupabaseClient();
const route = useRoute();

const signOut = async () => {
  await client.auth.signOut();
  navigateTo("/");
};

const buttonVariant: ButtonVariants["variant"] = "ghost";
</script>

<template>
  <div class="flex flex-col h-full items-center justify-between py-8">
    <div>
      <NuxtLink
        to="/dashboard"
        class="text-xl font-semibold text-white hover:text-white/80"
        >semanti<span class="text-primary">/</span>core</NuxtLink
      >
    </div>
    <ClientOnly>
      <NavigationMenu class="flex flex-col gap-2">
        <NavigationMenuList class="flex flex-col gap-2">
          <NavigationMenuItem>
            <NuxtLink to="/datasets/new">
              <Button
                variant="outline"
                class="w-full bg-zinc-900 text-white border-white/20 hover:bg-white/5 hover:border-white/40 hover:text-white transition-colors"
              >
                <Icon name="uil:plus" class="w-4 h-4 mr-2" />
                New dataset
              </Button>
            </NuxtLink>
          </NavigationMenuItem>
          <div class="h-4" />
          <NavigationMenuItem>
            <NavigationMenuLink
              :active="route.path === '/dashboard'"
              class="block px-4 py-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white data-[active]:bg-white/10 data-[active]:text-white"
            >
              <NuxtLink to="/dashboard" class="flex items-center gap-2">
                <Icon name="heroicons:squares-2x2" class="w-4 h-4" />
                Dashboard
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              :active="route.path === '/my-datasets'"
              class="block px-4 py-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white data-[active]:bg-white/10 data-[active]:text-white"
            >
              <NuxtLink to="/my-datasets" class="flex items-center gap-2">
                <Icon name="heroicons:folder" class="w-4 h-4" />
                My datasets
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              :active="route.path === '/browse'"
              class="block px-4 py-2 rounded-md text-white/70 hover:bg-white/10 hover:text-white data-[active]:bg-white/10 data-[active]:text-white"
            >
              <NuxtLink to="/browse" class="flex items-center gap-2">
                <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
                Browse
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </ClientOnly>
    <Button
      :variant="buttonVariant"
      class="text-white/70 hover:text-white hover:bg-white/10"
      @click="signOut"
    >
      Sign out
    </Button>
  </div>
</template>
