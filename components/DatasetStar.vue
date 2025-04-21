<template>
  <div class="flex items-center gap-2">
    <Button
      v-if="!iconOnly"
      variant="ghost"
      size="sm"
      @click="toggleStar"
      :disabled="isLoading"
      class="flex items-center gap-1"
    >
      <Icon
        :name="isStarred ? 'heroicons:star-solid' : 'heroicons:star'"
        class="w-5 h-5"
      />
      {{ starCount }}
    </Button>
    <div v-else class="flex items-center gap-1">
      <Icon
        :name="isStarred ? 'heroicons:star-solid' : 'heroicons:star'"
        class="w-5 h-5 text-muted-foreground"
      />
      <span class="text-sm text-muted-foreground">{{ starCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "~/components/ui/button";
import type { Database } from "~/database.types";

const props = defineProps<{
  datasetId: string;
  iconOnly?: boolean;
  isStarred: boolean;
  starCount: number;
}>();

const emit = defineEmits<{
  (e: "update:isStarred", value: boolean): void;
  (e: "update:starCount", value: number): void;
}>();

const client = useSupabaseClient<Database>();
const isLoading = ref(false);

const toggleStar = async () => {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  isLoading.value = true;

  if (props.isStarred) {
    await client
      .from("stars")
      .delete()
      .eq("dataset_id", props.datasetId)
      .eq("user_id", user.id);

    emit("update:isStarred", false);
    emit("update:starCount", props.starCount - 1);
  } else {
    await client.from("stars").insert({
      dataset_id: props.datasetId,
      user_id: user.id,
    });

    emit("update:isStarred", true);
    emit("update:starCount", props.starCount + 1);
  }

  isLoading.value = false;
};
</script>
