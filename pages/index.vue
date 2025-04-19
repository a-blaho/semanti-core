<template>
  <div class="min-h-screen grid place-items-center">
    <div class="w-full max-w-sm px-8">
      <h1 class="text-3xl font-bold text-center mb-8">
        semanti<span class="text-primary">/</span>core
      </h1>
      <div
        class="border bg-background/95 rounded-lg p-6 flex flex-col items-center gap-6 shadow-lg backdrop-blur-sm"
      >
        <Button variant="outline" class="w-full" @click="signInWithGitHub">
          <Icon name="uil:github" class="w-4 h-4 mr-2" />
          Sign in with GitHub
        </Button>
        <div class="flex items-center gap-4 w-full">
          <div class="h-px flex-1 bg-border" />
          <p class="text-sm text-muted-foreground">or</p>
          <div class="h-px flex-1 bg-border" />
        </div>
        <div class="w-full">
          <p class="text-sm text-center text-muted-foreground mb-4">
            Sign in<span class="text-primary">/</span>up using just email
          </p>
          <form @submit.prevent="signIn" class="flex flex-col gap-3">
            <Input
              type="email"
              name="email"
              autocomplete="email"
              v-model="email"
              placeholder="Email"
              required
            />
            <Input
              v-if="emailSent"
              type="text"
              v-model="token"
              placeholder="Token"
              required
            />
            <Button type="submit" class="w-full">
              {{ emailSent ? "Sign in" : "Send code" }}
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "landing",
});

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const client = useSupabaseClient();
const email = ref("");
const token = ref("");
const emailSent = ref(false);

// Function to create user record in database
const createUserRecord = async () => {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to create user record:", await response.text());
    }
  } catch (error) {
    console.error("Error creating user record:", error);
  }
};

const signIn = async () => {
  if (!emailSent.value) {
    const { error } = await client.auth.signInWithOtp({
      email: email.value,
    });

    if (error) {
      alert(error.message);
      return;
    }

    emailSent.value = true;
  } else {
    const { error } = await client.auth.verifyOtp({
      email: email.value,
      token: token.value,
      type: "email",
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Create user record after successful login
    await createUserRecord();

    navigateTo("/dashboard");
  }
};

const signInWithGitHub = async () => {
  const { error } = await client.auth.signInWithOAuth({
    provider: "github",
  });

  if (error) {
    alert(error.message);
  }

  // Note: For OAuth, we need to handle the callback separately
  // The user record will be created when they land on the dashboard
};

// Listen for auth state changes to create user record after OAuth login
onMounted(() => {
  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      createUserRecord();
    }
  });
});
</script>
