<template>
  <div
    @click="navigateTo('/datasets/' + dataset?.id)"
    class="border text-space-950 bg-space-100 hover:border-space-950 w-full h-48 rounded-md p-4 border-space-300 cursor-pointer justify-self-center align-self-center"
    :class="{ 'animate-pulse': dataset == null }"
  >
    <template v-if="dataset">
      <div class="flex justify-between items-center">
        <p class="font-bold">{{ dataset.name }}</p>
        <p>{{ dataset.public ? "public" : "private" }}</p>
      </div>
      <p>
        {{ dataset.owner.name }}
      </p>
      <br />
      <div>
        <p class="truncate">{{ dataset.metadata["dc:description"] }}</p>
      </div>
      <br />
      <div class="flex justify-between items-center">
        <DatasetStar :dataset-id="dataset.id" />
        <p>{{ formatBytes(dataset.size) }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Dataset } from "~/utils/mapDataset";

defineProps({
  dataset: {
    type: Object as PropType<Dataset>,
  },
});
</script>
