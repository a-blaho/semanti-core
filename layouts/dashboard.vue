<template>
  <div
    style="
      display: grid;
      grid-template-areas: 'navbar main';
      grid-template-columns: 12rem 1fr;
    "
    class="h-screen"
  >
    <Navbar style="grid-area: navbar" />
    <div
      class="flex flex-col items-center justify-center bg-midnight-100"
      style="grid-area: main"
    >
      <slot />
    </div>
  </div>
</template>
