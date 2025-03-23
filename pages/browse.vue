<template>
  <div class="w-full h-full py-16 px-24 flex flex-col justify-between">
    <div>
      <h1 class="text-3xl">Browse datasets</h1>
      <br />
      <div class="w-full flex items-center justify-between">
        <div class="flex gap-1 items-center">
          <Input
            autocomplete="off"
            name="search"
            v-model="searchBuffer"
            placeholder="Search datasets"
            class="w-96"
          />
          <Button @click="search = searchBuffer" variant="default" class="h-9"
            >Search</Button
          >
        </div>
        <div class="flex items-center gap-1">
          <label class="w-24">Sort by:</label>
          <Select v-model="orderBy" class="w-48">
            <SelectTrigger>
              <SelectValue
                :placeholder="
                  orderBy === 'nameAsc'
                    ? 'Name ascending'
                    : orderBy === 'nameDesc'
                      ? 'Name descending'
                      : orderBy === 'createdAtAsc'
                        ? 'Newest'
                        : 'Oldest'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nameAsc">Name ascending</SelectItem>
              <SelectItem value="nameDesc">Name descending</SelectItem>
              <SelectItem value="createdAtAsc">Newest</SelectItem>
              <SelectItem value="createdAtDesc">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <br />
      <div
        class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
      >
        <div
          v-if="datasets?.data.length === 0"
          class="h-48 flex items-center justify-center col-span-4"
        >
          <p>No datasets found</p>
        </div>
        <DatasetCard
          v-else
          v-for="dataset in datasets?.data"
          :dataset="dataset"
        />
      </div>
    </div>
    <br />
    <div class="flex items-center justify-center gap-8">
      <Button
        variant="outline"
        :disabled="page === 0 || !!pending"
        @click="page--"
      >
        Previous page
      </Button>
      {{ page + 1 }} / {{ Math.ceil((datasets?.total ?? 0) / pageSize) }}
      <Button
        variant="outline"
        :disabled="
          !!pending ||
          (!!datasets &&
            page >= Math.ceil((datasets.total ?? 0) / pageSize) - 1)
        "
        @click="page++"
      >
        Next page
      </Button>
    </div>
    <br />
  </div>
</template>

<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Database } from "~/database.types";

definePageMeta({ layout: "dashboard" });

const client = useSupabaseClient<Database>();
provide("page-context", "browse");

const pageSize = 8;

const page = ref<number>(0);
const searchBuffer = ref<string>("");
const search = ref<string>("");
const orderBy = ref<string>("nameAsc");

const { data: datasets, pending } = await useAsyncData(
  `browse:${page.value}:${search.value}:${orderBy.value}`,
  async () => {
    const pagination = getPagination(page.value, pageSize);

    const partialQuery = client
      .from("datasets")
      .select("id, name, metadata, public, owner (name), size, created_at", {
        count: "exact",
      })
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

    if (!data || !count) {
      return {
        data: [],
        total: 0,
      };
    }

    return {
      data: data.map(toDataset),
      total: count,
    };
  },
  { watch: [page, search, orderBy] }
);
</script>
