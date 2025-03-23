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
}>();

const client = useSupabaseClient<Database>();

const isStarred = ref(false);
const isLoading = ref(true);
const starCount = ref<number>(0);

onMounted(async () => {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  const { data } = await client
    .from("stars")
    .select()
    .eq("dataset_id", props.datasetId)
    .eq("user_id", user.id)
    .maybeSingle();

  isStarred.value = data !== null;
  isLoading.value = false;

  const { count } = await client
    .from("stars")
    .select("dataset_id", { count: "exact" })
    .eq("dataset_id", props.datasetId);

  starCount.value = count ?? 0;
});

const toggleStar = async () => {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  isLoading.value = true;

  if (isStarred.value) {
    await client
      .from("stars")
      .delete()
      .eq("dataset_id", props.datasetId)
      .eq("user_id", user.id);

    isStarred.value = false;
    starCount.value -= 1;
  } else {
    await client.from("stars").insert({
      dataset_id: props.datasetId,
      user_id: user.id,
    });

    isStarred.value = true;
    starCount.value += 1;
  }

  isLoading.value = false;
};
</script>
