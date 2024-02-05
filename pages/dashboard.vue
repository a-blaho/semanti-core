<template>
  <div class="w-full h-full py-16 px-24">
    <h1 class="text-3xl">Dashboard</h1>
    <br />
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="!recentDatasets?.length && !pending"
        class="h-48 flex items-center justify-center col-span-4"
      >
        <p>No recent datasets</p>
      </div>
      <DatasetCard
        v-else
        v-for="dataset in recentDatasets"
        :dataset="dataset"
      />
    </div>

    <br />
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});

const user = useSupabaseUser();
const client = useSupabaseClient<Database>();

const { data: recentDatasets, pending } = await useAsyncData(
  "recent",
  async () => {
    if (!user.value) throw new Error("User not logged in");

    const { data } = await client
      .from("datasets")
      .select("id, name, metadata, size, public, owner(name)")
      .eq("owner", user.value.id)
      .order("created_at", { ascending: false })
      .limit(4);

    return data?.map(toDataset);
  }
);
</script>
