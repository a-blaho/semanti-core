<template>
  <div class="w-full h-full py-16 px-24">
    <h1 class="text-3xl">Dashboard</h1>
    <br />
    <div
      class="grid gap-4 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-2 md:grid-cols-1"
    >
      <div
        v-if="pending"
        class="h-48 flex items-center justify-center col-span-4"
      >
        <p>Loading...</p>
      </div>
      <div
        v-else-if="!datasets || datasets.length === 0"
        class="h-48 flex items-center justify-center col-span-4"
      >
        <p>No recent datasets</p>
      </div>
      <template v-else>
        <DatasetCard
          v-for="dataset in datasets"
          :key="dataset.id"
          :dataset="dataset"
        />
      </template>
    </div>
    <br />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Database } from "~/database.types";
import { toDataset } from "~/utils/mapDataset";

definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient<Database>();
provide("page-context", "dashboard");

const { data: recentDatasets, pending } = await useAsyncData(
  "recent",
  async () => {
    try {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const { data } = await client
        .from("datasets")
        .select("id, name, metadata, size, public, owner(name), created_at")
        .eq("owner", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (!data) return [];

      try {
        const transformed = data.map((d) => {
          return toDataset(d);
        });
        return transformed;
      } catch (transformError) {
        console.error("Error transforming datasets:", transformError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
      return [];
    }
  },
  {
    server: false, // Only fetch on client-side to ensure we have auth state
  }
);

const datasets = computed(() => {
  const value = recentDatasets.value;
  return value || [];
});
</script>
