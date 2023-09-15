<template>
  <h1 class="text-2xl text-midnight-blue-950">
    {{
      stage === 1
        ? "Upload your dataset"
        : stage === 2
        ? "Analyzing your file"
        : stage === 3
        ? "Dataset information"
        : "Columns information"
    }}
  </h1>
  <div class="flex">
    <Icon
      name="octicon:dot-fill-24"
      v-for="_ of stage"
      class="text-midnight-blue-950 h-8 w-8"
    />
    <Icon
      name="octicon:dot-24"
      v-for="_ of 4 - stage"
      class="text-midnight-blue-950 h-8 w-8"
    />
  </div>

  <label
    v-if="stage === 1"
    class="flex flex-col w-3/4 h-3/4 text-midnight-blue-900 bg-midnight-blue-200 hover:bg-midnight-blue-300 cursor-pointer border rounded-md justify-center items-center"
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

  <div
    v-if="stage === 2"
    class="flex flex-col items-center justify-center text-midnight-blue-950 w-3/4 h-3/4"
  >
    <Loading class="text-midnight-blue-950 w-64 h-64" />
  </div>

  <form
    v-if="stage === 3"
    class="bg-midnight-blue-200 w-3/4 h-3/4 flex flex-col items-center justify-between gap-2 px-8 py-4 border rounded-md border-midnight-blue-100"
    @submit.prevent="nextStage"
  >
    <div class="w-full flex justify-between">
      <Input
        class="w-3/4"
        name="datasetName"
        placeholder="Dataset name"
        required
        v-model="datasetName"
        autocomplete="off"
      />

      <div class="flex gap-1 items-center">
        <input type="checkbox" id="public" />
        <label for="public">Public dataset</label>
      </div>
    </div>
    <textarea
      name="datasetDescription"
      placeholder="Dataset description"
      v-model="datasetDescription"
      cols="75"
      rows="12"
      required
      class="border rounded-md p-1 w-full h-full focus:outline-none focus:border-midnight-blue-900"
    >
    </textarea>
    <div class="flex items-center w-full justify-between">
      <Button @click="resetStages" variant="outlined">Cancel</Button>
      <Button type="submit">Next</Button>
    </div>
  </form>

  <form
    class="bg-midnight-blue-200 w-3/4 h-3/4 flex flex-col items-center justify-between gap-2 px-8 py-4 border rounded-md border-midnight-blue-100 overflow-auto"
    v-if="stage === 4"
    @submit.prevent="uploadDataset"
  >
    <div class="grid grid-cols-5 gap-4">
      <template v-for="(column, index) in columns">
        <div class="flex items-center">
          <label class="font-mono truncate" :for="column + '-' + index">
            {{ column }}
          </label>
        </div>

        <div>
          <Input
            class="w-40"
            :name="'name-' + index"
            placeholder="Name"
            v-model="names[index]"
            required
            autocomplete="off"
          />
        </div>

        <div>
          <Input
            class="w-40"
            :name="'description-' + index"
            placeholder="Description"
            v-model="descriptions[index]"
            required
            autocomplete="off"
          />
        </div>

        <div>
          <Input
            class="w-40"
            :name="'type-' + index"
            placeholder="Data type"
            v-model="types[index]"
            required
            autocomplete="off"
          />
        </div>

        <div>
          <Input
            class="w-40"
            :name="'category-' + index"
            placeholder="Data category"
            v-model="categories[index]"
            required
            autocomplete="off"
          />
        </div>
      </template>
    </div>
    <br />
    <div class="flex items-center w-full justify-between">
      <Button variant="outlined" @click="resetStages">Cancel</Button>
      <div class="flex">
        <Button @click="previousStage">Previous</Button>
        <Button type="submit">Next</Button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { parse } from "csv-parse/browser/esm/sync";

definePageMeta({
  layout: "dashboard",
});

const input = ref<HTMLInputElement | null>(null);
const errorMessage = ref("");
const stage = ref(1);
const columns = ref<Array<string>>([]);

const datasetName = ref("");
const datasetDescription = ref("");

const names = ref<Array<string>>([]);
const descriptions = ref<Array<string>>([]);
const types = ref<Array<string>>([]);
const categories = ref<Array<string>>([]);

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

  const file = files[0];

  if (file.type !== "text/csv") {
    errorMessage.value = "Please upload a CSV file";
    return;
  }
  nextStage();

  const text = await file.text();
  const parsed: Array<Array<string>> = parse(text);

  columns.value = parsed[0];
  await new Promise((resolve) => setTimeout(resolve, 2000));

  nextStage();
};

const previousStage = () => stage.value--;

const nextStage = () => stage.value++;

const resetStages = () => {
  stage.value = 1;
  datasetName.value = "";
  datasetDescription.value = "";
  names.value = [];
};

const uploadDataset = () => {
  console.log({
    datasetName: datasetName.value,
    datasetDescription: datasetDescription.value,
    names: names.value,
    descriptions: descriptions.value,
    types: types.value,
    categories: categories.value,
  });

  // const formData = new FormData();
  // formData.append("file", csvFile);

  // await $fetch("/api/dataset", {
  //   method: "POST",
  //   body: formData,
  // });
};
</script>
