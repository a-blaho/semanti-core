<template>
  <div class="flex flex-col w-screen h-screen items-center justify-center">
    <h1 class="text-6xl select-none p-4">
      Semanti<span class="text-midnight-blue-900">/</span>core
    </h1>

    <div
      class="border border-midnight-blue-800 border-2 bg-midnight-blue-50 rounded-md border-slate-950 px-8 py-4 flex flex-col items-center gap-4"
    >
      <Button
        variant="outlined"
        @click="auth.signInWithOAuth({ provider: 'github' })"
        ><Icon name="uil:github" class="h-5 w-5" />Sign in via GitHub
      </Button>

      <div class="flex items-center gap-2">
        <hr class="h-0.5 w-32 border-0 bg-midnight-blue-900" />
        <p>or</p>
        <hr class="h-0.5 w-32 border-0 bg-midnight-blue-900" />
      </div>

      <h1 class="text-xl font-semibold">
        Sign in<span class="text-midnight-blue-900">/</span>up using just email
      </h1>

      <form @submit.prevent="otpLogin" class="flex flex-col gap-2 items-center">
        <Input
          class="w-72"
          autocomplete="email"
          name="email"
          placeholder="Email"
          type="email"
          required="true"
          v-model="email"
        />

        <p class="text-midnight-blue-900 text-sm">{{ infoMessage }}</p>
        <p class="text-red-500 text-sm">{{ errorMessage }}</p>

        <Button type="submit">Sign in</Button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "intro",
});

const user = useSupabaseUser();
const { auth } = useSupabaseAuthClient();

watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});

const email = ref("");
const errorMessage = ref("");
const infoMessage = ref("");

const otpLogin = async () => {
  const { error } = await auth.signInWithOtp({
    email: email.value,
  });

  if (error) {
    errorMessage.value = error.message;
    infoMessage.value = "";
  } else {
    infoMessage.value = "Check your email for the magic link";
    errorMessage.value = "";
  }
};
</script>
