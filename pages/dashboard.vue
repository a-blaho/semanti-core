<template>
  <div class="w-full h-full py-16 px-24 flex flex-col overflow-hidden clas">
    <h1 class="text-3xl">Dashboard</h1>
    <br />
    <h2 class="text-2xl">Recent datasets</h2>
    <div v-if="pending" class="flex gap-4 overflow-x-auto py-4">
      <div class="animate-pulse h-48 w-72 bg-midnight-blue-200 rounded-md" v-for="_ of 4">

      </div>
    </div>
    <p v-else-if="!recentDatasets">No recent datasets</p>
    <div v-else-if="recentDatasets" class="flex gap-4 overflow-x-auto py-4">
      <div v-for="dataset in recentDatasets" @click="navigateTo('/datasets/' + dataset.id)"
        class="p-4 bg-midnight-blue-200 border rounded-md h-48 w-72 cursor-pointer">

        <p class="font-bold">{{ dataset.metadata['dc:title'] }}</p>
        <p>
          {{
            //@ts-ignore
            dataset.owner.name
          }}
        </p>
        <br />
        <div>
          <p class="truncate">{{ dataset.metadata['dc:description'] }}</p>
        </div>
        <br />
        <br />
        <div class="w-full flex justify-between items-center">
          <DatasetStar :dataset-id="dataset.id" />
          <p>{{ dataset.public ? 'public' : 'private' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});
const user = useSupabaseUser()

const { data: recentDatasets, pending } = useFetch(
  '/api/datasets',
  { method: "GET", query: { owner: user.value?.id, limit: 4, orderBy: 'created_at', ascending: false } },
)
</script>
