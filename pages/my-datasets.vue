<template>
  <div class="w-full h-full py-16 px-24 flex flex-col justify-between">
    <div>
      <h1 class="text-3xl">My datasets</h1>
      <br />
      <div
        class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
      >
        <DatasetCard
          :loading="loading"
          v-for="dataset in datasets"
          :dataset="dataset"
        />
      </div>
    </div>
    <div class="flex items-center justify-center gap-8">
      <Button
        variant="outlined"
        :disabled="page == 0 || loading"
        @click="page--"
      >
        Previous page
      </Button>
      {{ page + 1 }} / {{ Math.ceil(total / pageSize) }}
      <Button
        variant="outlined"
        :disabled="isLastPage || loading"
        @click="page++"
      >
        Next page
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});
const client = useSupabaseClient<Database>();
const user = useSupabaseUser();

const pageSize = 12;

const page = ref<number>(0);
const total = ref<number>(1);
const datasets = ref<
  Array<{
    id: string;
    metadata: Metadata;
    public: boolean;
    owner: { name: string };
  }>
>(new Array(pageSize));
const isLastPage = ref<boolean>(false);
const loading = ref<boolean>(true);

const getPagination = (page: number, size: number) => {
  const limit = size;
  const from = page * limit;
  const to = from + size - 1;

  return { from, to };
};

watch(
  page,
  async () => {
    loading.value = true;
    const pagination = getPagination(page.value, pageSize);

    const { data, count } = await client
      .from("datasets")
      .select("*", { count: "exact" })
      .eq("owner", user.value!.id)
      .order("created_at", { ascending: false })
      .range(pagination.from, pagination.to);

    if (data && count) {
      if (count / pageSize - 1 <= page.value) {
        isLastPage.value = true;
      } else {
        isLastPage.value = false;
      }
      total.value = count;
      datasets.value = data.map((dataset) => ({
        ...dataset,
        metadata: toMetadata(dataset.metadata),
        owner: {
          //@ts-ignore
          name: dataset.owner.name,
        },
      }));
    }

    loading.value = false;
  },
  { immediate: true }
);
</script>
