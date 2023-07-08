<template>
  <div class="flex flex-col w-screen h-screen items-center justify-center">
    <h1 class="text-6xl select-none p-4">
      Semanti<span class="text-midnight-blue-900">/</span>core
    </h1>
    <div
      class="border border-midnight-blue-800 border-2 bg-midnight-blue-50 rounded-md border-slate-950 px-8 py-4 flex flex-col items-center gap-4"
    >
      <h1 class="text-2xl font-semibold">
        Sign <span class="text-midnight-blue-900">in</span>
      </h1>
      <Button variant="outlined" @click="oAuthLogin"
        ><Icon name="uil:github" class="h-5 w-5" />Sign in via GitHub
      </Button>
      <hr class="h-0.5 w-56 border-0 bg-midnight-blue-900" />
      <form
        @submit.prevent="passwordLogin"
        class="flex flex-col gap-2 items-center"
      >
        <Input
          class="w-72"
          autocomplete="email"
          name="email"
          placeholder="Email"
          type="email"
          required="true"
          v-model="email"
        />

        <Input
          class="w-72"
          autocomplete="current-password"
          name="password"
          placeholder="Password"
          type="password"
          required="true"
          v-model="password"
        />
        <p class="text-red-500 text-sm">{{ errorMessage }}</p>
        <Button type="submit">Sign in</Button>
      </form>
    </div>
    <p>
      Don't have an account yet?
      <span class="text-midnight-blue-900">
        <NuxtLink to="register">Register</NuxtLink></span
      >
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "intro",
});

const client = useSupabaseAuthClient();
const url = useRequestURL();
const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const oAuthLogin = async () =>
  await client.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${url.origin}/welcome` },
  });

const passwordLogin = async () => {
  const { error } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    errorMessage.value = error.message;
  } else {
    router.push("/dashboard");
  }
};
</script>
