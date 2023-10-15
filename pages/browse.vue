<template>
  <div class="w-full h-full py-16 px-24 flex flex-col justify-between">
    <div>
      <h1 class="text-3xl">Browse datasets</h1>
      <br />
      <div class="w-full flex items-center justify-between">
        <div class="flex gap-1 items-center">
          <TextInput
            autocomplete="off"
            name="search"
            v-model="searchBuffer"
            placeholder="Search datasets"
            class="w-96"
          />
          <Button @click="search = searchBuffer" class="h-9">Search</Button>
        </div>
        <div class="flex items-center gap-1">
          <label class="w-24">Sort by:</label>
          <SelectInput class="w-48" v-model="orderBy" name="search">
            <option value="nameAsc">Name ascending</option>
            <option value="nameDesc">Name descending</option>
            <option value="createdAtAsc">Newest</option>
            <option value="createdAtDesc">Oldest</option>
          </SelectInput>
        </div>
      </div>
      <br />
      <div
        class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
      >
        <div
          v-if="!datasets.filter(isNotNil).length && !loading"
          class="h-48 flex items-center justify-center col-span-4"
        >
          <p>No datasets found</p>
        </div>
        <DatasetCard
          :loading="loading"
          v-else
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
import { Dataset } from "~/components/DatasetCard.vue";
import { Database } from "~/database.types";

definePageMeta({ layout: "dashboard" });

const client = useSupabaseClient<Database>();

const pageSize = 12;

const loading = ref<boolean>(false);
const page = ref<number>(0);
const searchBuffer = ref<string>("");
const search = ref<string>("");
const orderBy = ref<string>("nameAsc");
const total = ref<number>(1);
const datasets = ref<Array<Dataset>>(new Array(pageSize));
const isLastPage = ref<boolean>(false);

watch(
  [page, search, orderBy],
  async () => {
    loading.value = true;

    const pagination = getPagination(page.value, pageSize);

    const partialQuery = client
      .from("datasets")
      .select("id, name, metadata, public, owner (name)", { count: "exact" })
      .eq("public", true);

    if (search.value !== "") {
      partialQuery.ilike("name", `%${search.value}%`);
    }

    if (orderBy.value === "nameAsc") {
      partialQuery.order("lower_name", { ascending: true });
    } else if (orderBy.value === "nameDesc") {
      partialQuery.order("lower_name", { ascending: false });
    } else if (orderBy.value === "createdAtAsc") {
      partialQuery.order("created_at", { ascending: true });
    } else if (orderBy.value === "createdAtDesc") {
      partialQuery.order("created_at", { ascending: false });
    }

    partialQuery.range(pagination.from, pagination.to);

    const { data, count } = await partialQuery;

    if (data != null && count != null) {
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
