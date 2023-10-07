<template>
  <div class="w-full h-full py-16 px-24">
    <h1 class="text-3xl">Dashboard</h1>
    <br />
    <h2 class="text-2xl">Recent datasets</h2>
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="loading"
        v-for="_ of 4"
        class="animate-pulse h-48 w-72 bg-midnight-blue-200 rounded-md"
      />
      <p v-else-if="!recentDatasets || !recentDatasets.length">
        No recent datasets
      </p>
      <div
        v-else-if="recentDatasets"
        v-for="dataset in recentDatasets"
        @click="navigateTo('/datasets/' + dataset.id)"
        class="p-4 bg-midnight-blue-200 border rounded-md h-48 w-72 cursor-pointer hover:bg-midnight-blue-300"
      >
        <p class="font-bold">{{ dataset.metadata["dc:title"] }}</p>
        <p>
          {{ dataset.owner.name }}
        </p>
        <br />
        <div>
          <p class="truncate">{{ dataset.metadata["dc:description"] }}</p>
        </div>
        <br />
        <div class="w-full flex justify-between items-center">
          <DatasetStar :dataset-id="dataset.id" />
          <p>{{ dataset.public ? "public" : "private" }}</p>
        </div>
      </div>
    </div>

    <br />

    <h2 class="text-2xl">Recent visualizations</h2>
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="loading"
        v-for="_ of 4"
        class="animate-pulse h-48 w-72 bg-midnight-blue-200 rounded-md"
      />
      <p v-else-if="!recentVisualizations || !recentVisualizations.length">
        No recent datasets
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});

const user = useSupabaseUser();
const client = useSupabaseClient<Database>();

const loading = ref<boolean>(true);
const recentDatasets = ref<null | Array<{
  id: string;
  metadata: Metadata;
  public: boolean;
  owner: { name: string };
}>>(null);
const recentVisualizations = ref<null | Array<any>>(null);

onMounted(async () => {
  if (!user.value) throw new Error("User not logged in");

  const { data } = await client
    .from("datasets")
    .select("id, metadata, public, owner (name)")
    .eq("owner", user.value.id)
    .order("created_at", { ascending: false })
    .limit(4);

  if (data) {
    recentDatasets.value = data.map((dataset) => ({
      ...dataset,
      metadata: toMetadata(dataset.metadata),
      owner: {
        //@ts-ignore
        name: dataset.owner.name,
      },
    }));
  }

  loading.value = false;
});
</script>
