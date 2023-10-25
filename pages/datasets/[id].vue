<template>
  <div
    v-if="dataset"
    style="
      display: grid;
      grid-template-areas:
        'info'
        'main';
      grid-template-rows: 4rem 1fr;
      height: 100vh;
    "
    class="w-full py-8 px-16"
  >
    <div
      class="flex justify-between items-end w-full pb-2"
      style="grid-area: info"
    >
      <div>
        <p>
          {{ dataset.owner.name }}
        </p>
        <h1 class="text-2xl font-bold">{{ dataset.metadata["dc:title"] }}</h1>
      </div>
      <div>
        <DatasetStar :dataset-id="dataset.id" />
        <Button @click="navigateTo(downloadUrl, { external: true })"
          >Download CSV</Button
        >
      </div>
    </div>
    <div style="grid-area: main" class="overflow-auto">
      <HeadlessTabGroup>
        <HeadlessTabList
          class="flex border-b border-space-500 text-lg top-0 sticky bg-space-50"
        >
          <HeadlessTab :class="tabStyle">General</HeadlessTab>
          <HeadlessTab :class="tabStyle">Preview</HeadlessTab>
        </HeadlessTabList>
        <HeadlessTabPanels class="pt-4">
          <HeadlessTabPanel class="flex flex-col gap-16">
            <div>
              <h2 class="text-xl font-bold">Description</h2>
              <p class="text-lg">{{ dataset.metadata["dc:description"] }}</p>
            </div>

            <div>
              <h2 class="text-xl font-bold">Charts</h2>
              <div
                class="h-48 w-72 border rounded-md hover:cursor-pointer bg-space-300 hover:bg-space-400"
              />
            </div>

            <div>
              <h2 class="text-xl font-bold">Comments</h2>
              <p>No comments yet</p>
            </div>
          </HeadlessTabPanel>
          <HeadlessTabPanel class="overflow-auto">
            <table class="font-mono w-full">
              <thead>
                <tr>
                  <th
                    class="border border-gray-400 px-4 py-2"
                    v-for="column in dataset.metadata.tableSchema.columns"
                  >
                    {{ column["titles"] }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows">
                  <td
                    class="border border-gray-400 px-4 py-2"
                    v-for="item in row"
                  >
                    {{ item }}
                  </td>
                </tr>
              </tbody>
            </table>
          </HeadlessTabPanel>
        </HeadlessTabPanels>
      </HeadlessTabGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/database.types";

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
const rows = ref<any>([]);

const tabStyle =
  "border-b px-8 ui-selected:border-space-950 focus:outline-none";

onMounted(async () => {
  const [{ data }, { data: url }, { data: file }] = await Promise.all([
    client
      .from("datasets")
      .select("id, owner (name), metadata")
      .eq("id", route.params.id),
    client.storage
      .from("datasets")
      .createSignedUrl(`${route.params.id}/${route.params.id}.csv`, 60),
    client.storage
      .from("datasets")
      .download(`${route.params.id}/${route.params.id}.csv`),
  ]);

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
  if (file) {
    rows.value = await parseCsv({ file, options: { start: 1, end: 11 } });
    console.log(rows.value);
  }

  downloadUrl.value = url?.signedUrl ?? null;
});
</script>
