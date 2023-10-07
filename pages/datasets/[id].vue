<template>
  <div v-if="dataset" class="w-full h-full py-16 px-24 flex flex-col gap-16">
    <div class="flex justify-between w-full">
      <div>
        <h1 class="text-3xl font-bold">{{ dataset.metadata["dc:title"] }}</h1>
        <p>
          {{ dataset.owner.name }}
        </p>
      </div>
      <div>
        <DatasetStar :dataset-id="dataset.id" />
        <Button @click="navigateTo(downloadUrl, { external: true })"
          >Download CSV</Button
        >
      </div>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Description</h2>
      <p class="text-lg">{{ dataset.metadata["dc:description"] }}</p>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Charts</h2>
      <div
        class="h-48 w-72 border rounded-md hover:cursor-pointer bg-midnight-blue-300 hover:bg-midnight-blue-400"
      ></div>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Comments</h2>
      <p>No comments yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient<Database>();
const route = useRoute();

const downloadUrl = ref<string | null>(null);
const dataset = ref<null | {
  id: string;
  metadata: Metadata;
  owner: { name: string };
}>(null);

onMounted(async () => {
  const { data } = await client
    .from("datasets")
    .select("id, owner (name), metadata")
    .eq("id", route.params.id);

  if (data?.length) {
    dataset.value = {
      id: data[0].id,
      metadata: toMetadata(data[0].metadata),
      owner: {
        //@ts-ignore
        name: data[0].owner.name,
      },
    };
  }

  const { data: url } = await client.storage
    .from("datasets")
    .createSignedUrl(`${route.params.id}/${route.params.id}.csv`, 60);

  downloadUrl.value = url?.signedUrl ?? null;
});
</script>
