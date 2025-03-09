<template>
  <h1 class="text-2xl text-space-950">
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
      class="text-space-950 h-8 w-8"
    />
    <Icon
      name="octicon:dot-24"
      v-for="_ of 4 - stage"
      class="text-space-950 h-8 w-8"
    />
  </div>

  <label
    v-if="stage === 1"
    class="flex flex-col hover:border-space-900 cursor-pointer justify-center items-center"
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
    <Loading class="text-space-950 w-64 h-64" />
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
      class="border rounded-md p-1 w-full h-full focus:outline-none focus:border-space-900"
    >
    </textarea>
    <div class="flex items-center w-full justify-between">
      <Button variant="outlined" @click="resetStages">Cancel</Button>
      <div class="flex">
        <Button @click="previousStage">Previous</Button>
        <Button type="submit">Next</Button>
      </div>
    </div>
  </form>

  <form
    v-if="stage === 4"
    class="flex flex-col items-center justify-between gap-2 px-8 py-4 overflow-y-auto"
    :class="commonStyle"
    @submit.prevent="uploadDataset"
  >
    <div class="grid grid-cols-5 gap-4 overflow-visible w-full">
      <template v-for="(column, index) in columns">
        <div class="flex items-center gap-2">
          <label class="font-mono truncate" :for="column + '-' + index">
            {{ names[index] }}
          </label>
          <div class="relative">
            <button
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="() => showPreview(index)"
            >
              <Icon name="heroicons:eye" class="w-5 h-5" />
            </button>
            <div
              v-if="previewIndex === index"
              class="fixed z-[100] mt-2 bg-white rounded-md shadow-lg p-4 min-w-[200px]"
              :style="getPreviewPosition(index)"
              :ref="(el) => setPreviewRef(el, index)"
            >
              <h3 class="font-bold mb-2">Sample Values:</h3>
              <ul class="text-sm">
                <li
                  v-for="value in analysisResults[index].sampleValues"
                  class="truncate"
                >
                  {{ value }}
                </li>
              </ul>
              <div class="mt-2 text-xs text-gray-500">
                <p>Type: {{ dataTypes[index] }}</p>
                <p>Format: {{ categories[index] }}</p>
                <p>
                  Confidence:
                  {{ (analysisResults[index].confidence * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
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

        <TextInput
          placeholder="Dataset category"
          :name="'category-' + index"
          required
          v-model="categories[index]"
          autocomplete="off"
        />
      </template>
    </div>
    <br />
    <div class="flex flex-row items-center w-full justify-between gap-4">
      <Button variant="outlined" @click="resetStages">Cancel</Button>
      <div class="flex gap-2 justify-end">
        <Button @click="previousStage">Previous</Button>
        <Button type="submit">Save</Button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ColumnAnalysis } from "~/utils/decisionTree";
import { detectDataTypes } from "~/utils/decisionTree";

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

const analysisResults = ref<ColumnAnalysis[]>([]);
const previewIndex = ref<number | null>(null);

const commonStyle =
  "bg-space-100 border-space-300 text-space-950 border rounded-md border-space-100 w-5/6 h-3/4 ";

const previews = ref<Map<number, HTMLElement>>(new Map());

const handleDrop = (event: DragEvent) =>
  processFiles(event.dataTransfer?.files);
const handleInput = () => processFiles(fileInput.value?.files);

const showPreview = (index: number) => {
  previewIndex.value = previewIndex.value === index ? null : index;
};

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

  const fileContent = await datasetFile.text();

  columns.value = (
    await parseCsv({
      file: datasetFile,
      options: { start: 0, end: 1 },
    })
  )[0];

  analysisResults.value = detectDataTypes(fileContent);

  names.value = analysisResults.value.map(
    (result: ColumnAnalysis) => result.header
  );
  descriptions.value = columns.value.map(() => "");
  dataTypes.value = analysisResults.value.map((result: ColumnAnalysis) => {
    switch (result.dataType) {
      case "number":
        return "number";
      case "date":
        return "date";
      case "boolean":
        return "boolean";
      default:
        return "string";
    }
  });
  categories.value = analysisResults.value.map((result: ColumnAnalysis) => {
    return result.dataFormat === "unknown" ? "" : result.dataFormat;
  });

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
    size: datasetFile.size,
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

function getPreviewPosition(index: number): string {
  const preview = previews.value.get(index);
  if (!preview) return "transform: translateY(0)";

  const rect = preview.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.top;

  if (spaceBelow < rect.height + 20) {
    return `transform: translateY(calc(-100% - 40px))`;
  }

  return "transform: translateY(0)";
}

function setPreviewRef(
  el: Element | ComponentPublicInstance | null,
  index: number
) {
  if (el && el instanceof HTMLElement) {
    previews.value.set(index, el);
  } else {
    previews.value.delete(index);
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (
    previewIndex.value !== null &&
    !(e.target as HTMLElement).closest(".relative")
  ) {
    previewIndex.value = null;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
