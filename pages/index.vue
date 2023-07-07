<template>
  <div
    class="flex flex-col gap-4 w-screen h-screen items-center justify-center"
  >
    <div class="text-center">
      <h1 class="text-6xl select-none">
        Semanti<span class="text-midnight-blue-900">/</span>core
      </h1>
      <p>The semantic annotation tool for your CSV files</p>
    </div>
    <div class="flex gap-4">
      <Button><NuxtLink to="login">Login</NuxtLink></Button>
      <Button><NuxtLink to="register">Register</NuxtLink></Button>
    </div>
  </div>
</template>
