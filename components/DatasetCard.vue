<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { inject } from "vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Dataset } from "~/utils/mapDataset";

defineProps({
  dataset: {
    type: Object as PropType<Dataset>,
  },
});

type PageContext = "browse" | "dashboard" | "my-datasets";
const pageContext = inject<PageContext>("page-context", "dashboard");
</script>

<template>
  <Card
    @click="navigateTo('/datasets/' + dataset?.id)"
    class="h-56 cursor-pointer hover:bg-accent transition-colors flex flex-col"
    :class="{ 'animate-pulse': dataset == null }"
  >
    <template v-if="dataset">
      <CardHeader class="pb-2">
        <div class="flex justify-between items-center">
          <CardTitle class="text-base">{{ dataset.name }}</CardTitle>
          <Icon
            v-if="pageContext !== 'browse'"
            :icon="
              dataset.public ? 'heroicons:globe-alt' : 'heroicons:lock-closed'
            "
            class="w-4 h-4 text-muted-foreground"
          />
        </div>
        <CardDescription>
          <div class="flex flex-col gap-0.5">
            <span>{{ dataset.owner.name }}</span>
            <span class="text-xs">{{
              new Date(dataset.created_at).toLocaleDateString()
            }}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent class="pb-2 flex-1">
        <p class="line-clamp-3 text-sm text-muted-foreground">
          {{ dataset.metadata.tables[0]["dc:description"] }}
        </p>
      </CardContent>
      <CardFooter class="flex justify-between items-center mt-auto">
        <DatasetStar :dataset-id="dataset.id" :icon-only="true" />
        <p class="text-sm text-muted-foreground">
          {{ formatBytes(dataset.size) }}
        </p>
      </CardFooter>
    </template>
  </Card>
</template>
