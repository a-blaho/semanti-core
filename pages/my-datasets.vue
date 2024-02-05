<template>
  <div class="w-full h-full py-16 px-24 flex flex-col justify-between">
    <div>
      <h1 class="text-3xl">My datasets</h1>
      <br />
      <div
        class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
      >
        <div
          v-if="myDatasets?.data.length === 0"
          class="h-48 flex items-center justify-center col-span-4"
        >
          <p>No datasets</p>
        </div>
        <DatasetCard
          v-else
          v-for="dataset in myDatasets?.data"
          :dataset="dataset"
        />
      </div>
    </div>
    <br />
    <div class="flex items-center justify-center gap-8">
      <Button
        variant="outlined"
        :disabled="page == 0 || pending"
        @click="page--"
      >
        Previous page
      </Button>
      {{ page + 1 }} / {{ Math.ceil((myDatasets?.total ?? 0) / pageSize) }}
      <Button
        variant="outlined"
        :disabled="isLastPage || pending"
        @click="page++"
      >
        Next page
      </Button>
    </div>
    <br />
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});
const client = useSupabaseClient<Database>();
const user = useSupabaseUser();

const pageSize = 8;

const page = ref<number>(0);
const isLastPage = ref<boolean>(false);

const { data: myDatasets, pending } = await useAsyncData(
  `my-datasets:${page.value}`,
  async () => {
    const pagination = getPagination(page.value, pageSize);

    const { data, count } = await client
      .from("datasets")
      .select("id, name, metadata, public, owner (name), size", {
        count: "exact",
      })
      .eq("owner", user.value!.id)
      .order("created_at", { ascending: false })
      .range(pagination.from, pagination.to);

    if (!data || !count) {
      return {
        data: [],
        total: 0,
      };
    }

    if (count / pageSize - 1 <= page.value) {
      isLastPage.value = true;
    } else {
      isLastPage.value = false;
    }

    return {
      data: data.map(toDataset),
      total: count,
    };
  },
  { watch: [page] }
);
</script>
