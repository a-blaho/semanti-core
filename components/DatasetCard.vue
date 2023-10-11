<template>
  <div
    @click="navigateTo('/datasets/' + dataset.id)"
    class="p-4 bg-midnight-200 border rounded-md h-48 w-72 cursor-pointer hover:bg-midnight-300"
    :class="{ 'animate-pulse': loading }"
  >
    <template v-if="!loading">
      <p class="font-bold">{{ dataset.metadata["dc:title"] }}</p>
      <p>
        {{ dataset.owner.name }}
      </p>
      <br />
      <div>
        <p class="truncate">{{ dataset.metadata["dc:description"] }}</p>
      </div>
      <br />
      <div class="w-full flex justify-between items-center">
        <DatasetStar :dataset-id="dataset.id" />
        <p>{{ dataset.public ? "public" : "private" }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps({
  dataset: {
    type: Object as PropType<{
      id: string;
      metadata: Metadata;
      owner: { name: string };
      public: boolean;
    }>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
});
</script>
