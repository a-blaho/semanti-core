<template>
  <div class="w-full h-full py-16 px-24">
    <h1 class="text-3xl">Dashboard</h1>
    <br />
    <h2 class="text-2xl">Recent datasets</h2>
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="!recentDatasets.filter(isNotNil).length && !loading"
        class="h-48 flex items-center justify-center col-span-4"
      >
        <p>No recent datasets</p>
      </div>
      <DatasetCard
        :loading="loading"
        v-else
        v-for="dataset in recentDatasets"
        :dataset="dataset"
      />
    </div>

    <br />

    <h2 class="text-2xl">Recent visualizations</h2>
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="loading"
        v-for="_ of 4"
        class="animate-pulse h-48 w-72 bg-space-200 rounded-md"
      />
      <div
        v-else-if="!recentVisualizations || !recentVisualizations.length"
        class="h-48 flex items-center justify-center col-span-4"
      >
        <p>No recent visualizations</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dataset } from "~/components/DatasetCard.vue";
import type { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});

const user = useSupabaseUser();
const client = useSupabaseClient<Database>();

const loading = ref<boolean>(true);
const recentDatasets = ref<Array<Dataset>>(new Array(4));
const recentVisualizations = ref<null | Array<any>>(null);

onMounted(async () => {
  if (!user.value) throw new Error("User not logged in");

  const { data } = await client
    .from("datasets")
    .select("id, name, metadata, public, owner (name)")
    .eq("owner", user.value.id)
    .order("created_at", { ascending: false })
    .limit(4);

  if (data != null) {
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
