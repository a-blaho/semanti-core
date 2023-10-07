<template>
  <div v-if="data" class="w-full h-full py-16 px-24 flex flex-col gap-16">
    <div class="flex justify-between w-full">
      <div>
        <h1 class="text-3xl font-bold">{{ data[0].metadata['dc:title'] }}</h1>
        <p>{{
          //@ts-ignore
          data[0].owner.name
        }}</p>
      </div>
      <div>
        <DatasetStar :dataset-id="data[0].id" />
        <Button>Download CSV</Button>
      </div>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Description</h2>
      <p class="text-lg">{{ data[0].metadata['dc:description'] }}</p>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Charts</h2>
      <div class="h-48 w-72 border rounded-md hover:cursor-pointer bg-midnight-blue-300 hover:bg-midnight-blue-400"></div>
    </div>

    <div>
      <h2 class="text-2xl font-bold">Comments</h2>
      <p>No comments yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const route = useRoute()

const { data } = useFetch(
  '/api/datasets',
  { method: "GET", query: { id: route.params.id } },
)

</script>
