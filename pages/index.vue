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
              :disabled="emailSent"
              ref="emailInput"
              @input="validateEmail"
            />
            <Input
              v-if="emailSent"
              type="text"
              v-model="token"
              placeholder="Token"
              required
              @input="validateToken"
            />
            <p v-if="errorMessage" class="text-sm text-destructive mt-1">
              {{ errorMessage }}
            </p>
            <Button
              type="submit"
              class="w-full"
              :disabled="
                !isValidEmail || (emailSent && !isValidToken) || isLoading
              "
            >
              <template v-if="isLoading">
                <Icon name="uil:spinner" class="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </template>
              <template v-else>
                {{ emailSent ? "Sign in" : "Send code" }}
              </template>
            </Button>
            <Button
              v-if="emailSent"
              type="button"
              variant="ghost"
              class="w-full"
              @click="resetEmailState"
            >
              <Icon name="uil:arrow-left" class="w-4 h-4 mr-2" />
              Back to email
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
const isValidEmail = ref(false);
const isValidToken = ref(false);
const emailInput = ref<HTMLInputElement | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

// Function to validate email format
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  isValidEmail.value = emailRegex.test(email.value);
};

// Function to validate token
const validateToken = () => {
  isValidToken.value = token.value.length > 0;
};

// Function to reset email state
const resetEmailState = () => {
  emailSent.value = false;
  token.value = "";
  isValidToken.value = false;
  // Re-enable email input and focus it
  nextTick(() => {
    if (emailInput.value) {
      emailInput.value.$el.focus();
    }
  });
};

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
    isLoading.value = true;
    errorMessage.value = "";
    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.value,
      });

      if (error) {
        errorMessage.value = error.message;
        return;
      }

      emailSent.value = true;
    } finally {
      isLoading.value = false;
    }
  } else {
    errorMessage.value = "";
    const { error } = await client.auth.verifyOtp({
      email: email.value,
      token: token.value,
      type: "email",
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    // Create user record after successful login
    await createUserRecord();

    navigateTo("/dashboard");
  }
};

const signInWithGitHub = async () => {
  errorMessage.value = "";
  const { error } = await client.auth.signInWithOAuth({
    provider: "github",
  });

  if (error) {
    errorMessage.value = error.message;
  }

  // Note: For OAuth, we need to handle the callback separately
  // The user record will be created when they land on the dashboard
};

// Focus email input on mount
onMounted(() => {
  if (emailInput.value) {
    emailInput.value.$el.focus();
  }

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      createUserRecord();
    }
  });
});
</script>
