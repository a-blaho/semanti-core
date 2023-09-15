<template>
  <h1>Create new dataset</h1>
  <p>Step 1/3</p>
  <label
    class="flex flex-col w-96 h-96 text-midnight-blue-900 bg-midnight-blue-100 hover:bg-midnight-blue-200 cursor-pointer border rounded-md justify-center items-center"
    @drop.prevent="handleDrop"
    @dragover.prevent
  >
    <Icon name="uil:upload" class="w-16 h-16" />
    <p>Click to upload or drop your CSV file here</p>
    <input
      @input="handleInput"
      id="dropzone"
      class="hidden"
      type="file"
      ref="input"
      accept=".csv"
    />
    <p class="text-red-500 text-sm">{{ errorMessage }}</p>
  </label>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const input = ref<HTMLInputElement | null>(null);
const errorMessage = ref("");

const handleDrop = (event: DragEvent) => processFile(event.dataTransfer?.files);
const handleInput = () => processFile(input.value?.files);

const processFile = async (files: FileList | undefined | null) => {
  if (files == null) {
    return;
  }

  if (files.length > 1) {
    errorMessage.value = "Please upload only one file";
    return;
  }

  const csvFile = files[0];

  if (csvFile.type !== "text/csv") {
    errorMessage.value = "Please upload a CSV file";
    return;
  }

  const formData = new FormData();
  formData.append("file", csvFile);

  await $fetch("/api/dataset", {
    method: "POST",
    body: formData,
  });
};
</script>
