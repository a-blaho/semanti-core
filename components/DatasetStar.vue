<template>
  <div class="flex items-center gap-1">
    <p>{{ starCount }}</p>
    <Icon
      @click.stop="toggleStar"
      :name="starred ? 'ic:round-star' : 'ic:round-star-border'"
      class="cursor-pointer text-midnight-blue-900 w-8 h-8"
    />
  </div>
</template>

<script setup lang="ts">
import { Database } from "~/database.types";

const props = defineProps({
  datasetId: { required: true, type: String },
});

const user = useSupabaseUser();
const client = useSupabaseClient<Database>();

const starred = ref<boolean>(false);
const starCount = ref<number>(0);

if (!user.value) throw new Error("User not logged in");
const [{ data }, { count }] = await Promise.all([
  client
    .from("stars")
    .select()
    .eq("dataset_id", props.datasetId)
    .eq("user_id", user.value.id),
  client
    .from("stars")
    .select("dataset_id", { count: "exact" })
    .eq("dataset_id", props.datasetId),
]);

starred.value = data ? data.length > 0 : false;
starCount.value = count ?? 0;

const toggleStar = async () => {
  if (!user.value) throw new Error("User not logged in");

  if (starred.value) {
    await client
      .from("stars")
      .delete()
      .eq("dataset_id", props.datasetId)
      .eq("user_id", user.value.id);

    starred.value = false;
    starCount.value -= 1;
  } else {
    await client
      .from("stars")
      .insert({ dataset_id: props.datasetId, user_id: user.value.id });

    starred.value = true;
    starCount.value += 1;
  }
};
</script>
