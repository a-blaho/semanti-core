<template>
  <div class="flex h-screen bg-muted/30">
    <div class="w-64 bg-zinc-900 border-r border-border/40">
      <Navbar />
    </div>
    <div class="flex-1 overflow-auto">
      <slot />
    </div>
  </div>
</template>
