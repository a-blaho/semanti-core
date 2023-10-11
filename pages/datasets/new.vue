<template>
  <h1 class="text-2xl text-midnight-950">
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
      class="text-midnight-950 h-8 w-8"
    />
    <Icon
      name="octicon:dot-24"
      v-for="_ of 4 - stage"
      class="text-midnight-950 h-8 w-8"
    />
  </div>

  <label
    v-if="stage === 1"
    class="flex flex-col hover:border-midnight-900 cursor-pointer justify-center items-center"
    :class="commonStyle"
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
      ref="fileInput"
      accept=".csv"
    />
    <p class="text-red-500 text-sm">{{ errorMessage }}</p>
  </label>

  <div
    v-if="stage === 2"
    class="flex flex-col items-center justify-center"
    :class="commonStyle"
  >
    <Loading class="text-midnight-950 w-64 h-64" />
  </div>

  <form
    v-if="stage === 3"
    class="flex flex-col items-center justify-between gap-2 px-8 py-4"
    :class="commonStyle"
    @submit.prevent="nextStage"
  >
    <div class="w-full flex justify-between">
      <TextInput
        class="w-3/4"
        name="datasetName"
        placeholder="Dataset name"
        required
        v-model="datasetName"
        autocomplete="off"
      />

      <div class="flex gap-1 items-center">
        <input v-model="publicDataset" type="checkbox" id="public" />
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
      class="border rounded-md p-1 w-full h-full focus:outline-none focus:border-midnight-900"
    >
    </textarea>
    <div class="flex items-center w-full justify-between">
      <Button @click="resetStages" variant="outlined">Cancel</Button>
      <Button type="submit">Next</Button>
    </div>
  </form>

  <form
    class="flex flex-col items-center justify-between gap-2 px-8 py-4"
    :class="commonStyle"
    v-if="stage === 4"
    @submit.prevent="uploadDataset"
  >
    <div class="grid grid-cols-5 gap-4 overflow-auto w-full">
      <template v-for="(column, index) in columns">
        <div class="flex items-center">
          <label class="font-mono truncate" :for="column + '-' + index">
            {{ column }}
          </label>
        </div>

        <TextInput
          :name="'name-' + index"
          placeholder="Name"
          v-model="names[index]"
          required
          autocomplete="off"
        />

        <TextInput
          :name="'description-' + index"
          placeholder="Description"
          v-model="descriptions[index]"
          required
          autocomplete="off"
        />

        <SelectInput
          placeholder="Data type"
          :name="'type-' + index"
          required
          v-model="dataTypes[index]"
        >
          <option value="boolean">Boolean</option>
          <option value="date">Date</option>
          <option value="datetime">Datetime</option>
          <option value="duration">Duration</option>
          <option value="number">Number</option>
          <option value="string">String</option>
          <option value="time">Time</option>
        </SelectInput>

        <SelectInput
          placeholder="Dataset category"
          :name="'type-' + index"
          required
          v-model="categories[index]"
        >
          <optgroup label="Numerical values">
            <option value="price">Price</option>
            <option value="quantity">Quantity</option>
            <option value="rating">Rating</option>
            <option value="percentage">Percentage</option>
            <option value="count">Count</option>
          </optgroup>
          <optgroup label="Date and time">
            <option value="Start of">Start of</option>
            <option value="End of">End of</option>
            <option value="Duration">Duration</option>
          </optgroup>
          <optgroup label="Geographical">
            <option value="Country">Country</option>
            <option value="State">State</option>
            <option value="City">City</option>
            <option value="Address">Address</option>
            <option value="Zip code">Zip code</option>
            <option value="Latitude">Latitude</option>
            <option value="Longitude">Longitude</option>
          </optgroup>
        </SelectInput>
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

const fileInput = ref<HTMLInputElement | null>(null);

const errorMessage = ref("");
const stage = ref(1);
const columns = ref<Array<string>>([]);

let datasetFile: File | null = null;

const publicDataset = ref(false);
const datasetName = ref("");
const datasetDescription = ref("");

const names = ref<Array<string>>([]);
const descriptions = ref<Array<string>>([]);
const dataTypes = ref<Array<string>>([]);
const categories = ref<Array<string>>([]);

const commonStyle =
  "bg-midnight-200 text-midnight-950 border rounded-md border-midnight-100 w-3/4 h-3/4 ";

const handleDrop = (event: DragEvent) =>
  processFiles(event.dataTransfer?.files);
const handleInput = () => processFiles(fileInput.value?.files);

const processFiles = async (files: FileList | undefined | null) => {
  if (files == null) {
    return;
  }

  if (files.length > 1) {
    errorMessage.value = "Please upload only one file";
    return;
  }

  datasetFile = files[0];

  if (datasetFile.type !== "text/csv") {
    errorMessage.value = "Please upload a CSV file";
    return;
  }

  if (datasetFile.size > 6000000) {
    errorMessage.value = "Files up to 6MB are supported";
    return;
  }

  nextStage();

  const stream = datasetFile.stream();
  const reader = stream.getReader();
  let firstLine = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const chunk = new TextDecoder("utf-8").decode(value);
    const index = chunk.indexOf("\n");

    if (index !== -1) {
      firstLine += chunk.substring(0, index);
      await reader.cancel();
      break;
    }
    firstLine += chunk;
  }

  columns.value = parse(firstLine)[0];
  await new Promise((resolve) => setTimeout(resolve, 2000));

  nextStage();
};

const previousStage = () => stage.value--;

const nextStage = () => stage.value++;

const resetStages = () => {
  stage.value = 1;

  publicDataset.value = false;
  datasetName.value = "";
  datasetDescription.value = "";

  names.value.length = 0;
  descriptions.value.length = 0;
  dataTypes.value.length = 0;
  categories.value.length = 0;
};

const uploadDataset = async () => {
  if (datasetFile == null) return;

  const formData = new FormData();

  const metadata = {
    public: publicDataset.value,
    name: datasetName.value,
    description: datasetDescription.value,
    columns: columns.value.map((_, index) => ({
      title: columns.value[index],
      name: names.value[index],
      description: descriptions.value[index],
      datatype: dataTypes.value[index],
      category: categories.value[index],
    })),
  };

  formData.append("dataset", datasetFile);
  formData.append("metadata", JSON.stringify(metadata));

  const { error, data } = await useFetch("/api/datasets", {
    method: "POST",
    body: formData,
  });

  if (error.value != null || data.value == null) {
    console.error(error.value);
    return;
  }

  navigateTo(`/datasets/${data.value.id}`);
};
</script>
