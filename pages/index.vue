<template>
  <div class="flex flex-col w-screen h-screen items-center justify-center">
    <h1 class="text-6xl select-none p-4">
      semanti<span class="text-space-900">/</span>core
    </h1>

    <div
      class="border border-space-800 border-2 bg-space-50 rounded-md border-slate-950 px-8 py-4 flex flex-col items-center gap-4"
    >
      <Button variant="outlined" @click="signInWithGithub">
        <Icon name="uil:github" class="h-5 w-5" />Sign in via GitHub
      </Button>

      <div class="flex items-center gap-2">
        <hr class="h-0.5 w-32 border-0 bg-space-900" />
        <p>or</p>
        <hr class="h-0.5 w-32 border-0 bg-space-900" />
      </div>

      <h1 class="text-xl font-semibold">
        Sign in<span class="text-space-900">/</span>up using just email
      </h1>

      <form @submit.prevent="signIn" class="flex flex-col gap-2 items-center">
        <TextInput
          class="w-72"
          autocomplete="email"
          name="email"
          placeholder="Enter your email address"
          type="email"
          required="true"
          v-model="email"
          :disabled="emailSent"
        />

        <TextInput
          v-if="emailSent"
          class="w-72"
          autocomplete="one-time-code"
          name="token"
          placeholder="Enter the token you received via email"
          type="text"
          inputmode="numeric"
          required="true"
          v-model="token"
        />

        <p
          v-if="emailSent"
          class="text-sm hover:cursor-pointer hover:underline text-space-900"
          @click="resetForm"
        >
          Use a different email
        </p>

        <Button :loading="loading" type="submit" class="w-72"> Sign in </Button>
      </form>
      <p class="text-red-500 text-sm">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "index",
});

const user = useSupabaseUser();
const { auth } = useSupabaseClient();

const emailSent = ref(false);
const loading = ref(false);

const email = ref("");
const token = ref("");

const errorMessage = ref("");

watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});
const signInWithGithub = async () => {
  const { error } = await auth.signInWithOAuth({ provider: "github" });

  if (error) {
    errorMessage.value = error.message;
  } else {
    await $fetch("/api/users", {
      method: "POST",
      headers: useRequestHeaders(["cookie"]),
    });
  }
};
const signIn = async () => {
  loading.value = true;
  errorMessage.value = "";

  if (!emailSent.value) {
    await sendToken();
  } else {
    await verifyToken();
  }

  loading.value = false;
};

const sendToken = async () => {
  const { error } = await auth.signInWithOtp({
    email: email.value,
  });

  if (error) {
    errorMessage.value = error.message;
  } else {
    emailSent.value = true;
  }
};

const verifyToken = async () => {
  const { error } = await auth.verifyOtp({
    email: email.value,
    token: token.value,
    type: "email",
  });

  if (error) {
    errorMessage.value = error.message;
  } else {
    await $fetch("/api/users", {
      method: "POST",
      headers: useRequestHeaders(["cookie"]),
    });
    navigateTo("/dashboard");
  }
};

const resetForm = () => {
  emailSent.value = false;
  errorMessage.value = "";
  email.value = "";
};
</script>
