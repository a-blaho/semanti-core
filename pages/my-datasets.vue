<template>
  <div class="w-full h-full py-16 px-24 grid grid-rows-[1fr_auto] gap-8">
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
    <div class="flex items-center justify-center gap-8">
      <Button
        variant="outline"
        :disabled="page == 0 || pending"
        @click="page--"
      >
        Previous page
      </Button>
      {{ page + 1 }} / {{ Math.ceil((myDatasets?.total ?? 0) / pageSize) }}
      <Button
        variant="outline"
        :disabled="isLastPage || pending"
        @click="page++"
      >
        Next page
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Button } from "~/components/ui/button";
import type { Database } from "~/database.types";
import { ensureUserRecordExists } from "~/utils/ensureUserRecord";
import { getPagination } from "~/utils/getPagination";
import { toDataset } from "~/utils/mapDataset";

definePageMeta({
  layout: "dashboard",
});
const client = useSupabaseClient<Database>();
provide("page-context", "my-datasets");

const pageSize = 6;

const page = ref<number>(0);
const isLastPage = ref<boolean>(false);

onMounted(() => {
  ensureUserRecordExists(client);
});

const { data: myDatasets, pending } = await useAsyncData(
  "my-datasets",
  async () => {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error("User not logged in");

    const pagination = getPagination(page.value, pageSize);

    const { data, count } = await client
      .from("datasets")
      .select(
        `
        id, 
        name, 
        metadata, 
        public, 
        owner (name), 
        size, 
        created_at,
        stars:stars(count)
      `,
        {
          count: "exact",
        }
      )
      .eq("owner", user.id)
      .order("created_at", { ascending: false })
      .range(pagination.from, pagination.to);

    if (!data || !count) {
      return {
        data: [],
        total: 0,
      };
    }

    // Get which datasets the user has starred
    const { data: userStars } = await client
      .from("stars")
      .select("dataset_id")
      .eq("user_id", user.id)
      .in(
        "dataset_id",
        data.map((d) => d.id)
      );

    // Create set for quick lookup
    const starredDatasetIds = new Set(
      (userStars || []).map((s) => s.dataset_id)
    );

    if (count / pageSize - 1 <= page.value) {
      isLastPage.value = true;
    } else {
      isLastPage.value = false;
    }

    return {
      data: data.map((dataset) => ({
        ...toDataset(dataset),
        isStarred: starredDatasetIds.has(dataset.id),
        starCount: dataset.stars?.[0]?.count || 0,
      })),
      total: count,
    };
  },
  { watch: [page] }
);
</script>
