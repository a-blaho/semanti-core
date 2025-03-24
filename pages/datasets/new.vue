<template>
  <div class="w-full max-w-5xl mx-auto py-8 px-6">
    <h1 class="text-3xl font-semibold mb-6">
      {{
        stage === 1
          ? "Upload your dataset"
          : stage === 2
            ? "Analyzing your file"
            : stage === 3
              ? "Dataset information"
              : "Configure columns"
      }}
    </h1>
    <div class="flex gap-2 mb-8">
      <div
        v-for="step of 4"
        :key="step"
        class="flex items-center"
        :class="step !== 4 && 'flex-1'"
      >
        <div
          class="h-2 w-2 rounded-full transition-all duration-200"
          :class="step <= stage ? 'bg-primary scale-125' : 'bg-border'"
        ></div>
        <div
          v-if="step !== 4"
          class="h-0.5 w-full transition-all duration-200"
          :class="step < stage ? 'bg-primary' : 'bg-border'"
        ></div>
      </div>
    </div>

    <div v-if="stage === 1" class="flex flex-col items-center w-full gap-4">
      <div class="flex items-center gap-4 w-full max-w-3xl justify-end">
        <div class="flex items-center space-x-2">
          <Switch v-model="useOpenAI" />
          <label
            for="use-ai"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use AI to analyze dataset
          </label>
        </div>
      </div>

      <label
        class="flex flex-col hover:border-primary hover:bg-primary/5 cursor-pointer justify-center items-center transition-colors duration-200 max-w-3xl w-full"
        :class="[
          'bg-background border-2 border-dashed rounded-lg h-96',
          errorMessage ? 'border-destructive/50' : 'border-border',
        ]"
        @drop.prevent="handleDrop"
        @dragover.prevent
      >
        <Icon name="uil:upload" class="w-16 h-16 text-primary mb-4" />
        <p class="text-muted-foreground">
          Click to upload or drop your CSV file here
        </p>
        <input
          @input="handleInput"
          id="dropzone"
          class="hidden"
          type="file"
          ref="fileInput"
          accept=".csv"
        />
        <p class="text-destructive text-sm mt-2">{{ errorMessage }}</p>
      </label>
    </div>

    <div
      v-if="stage === 2"
      class="flex flex-col items-center justify-center max-w-3xl mx-auto h-96 bg-background border-2 border-dashed border-border rounded-lg p-8"
    >
      <Loading className="text-primary w-16 h-16" />
      <div class="mt-6 w-full max-w-md space-y-4">
        <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            class="bg-primary h-full transition-all duration-300"
            :style="{ width: `${analysisProgress.percent || 0}%` }"
          ></div>
        </div>
        <p class="text-muted-foreground text-center">
          {{ analysisProgress.status || "Analyzing your dataset..." }}
        </p>
      </div>
    </div>

    <form
      v-if="stage === 3"
      class="flex flex-col items-center justify-between gap-6 p-6 bg-card border rounded-lg max-w-3xl mx-auto"
      @submit.prevent="nextStage"
    >
      <div class="w-full flex justify-between gap-6">
        <Input
          class="flex-1"
          name="datasetName"
          placeholder="Dataset name"
          required
          v-model="datasetName"
          autocomplete="off"
        />

        <div class="flex items-center space-x-2">
          <Switch id="public" v-model:checked="publicDataset" />
          <label
            for="public"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Public dataset
          </label>
        </div>
      </div>
      <Textarea
        name="datasetDescription"
        placeholder="Dataset description"
        v-model="datasetDescription"
        required
        class="w-full h-48 resize-none"
      />
      <div class="flex items-center w-full justify-between">
        <Button
          variant="outline"
          @click="resetStages"
          class="text-muted-foreground"
        >
          Cancel
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" @click="previousStage">Previous</Button>
          <Button type="submit">Next</Button>
        </div>
      </div>
    </form>

    <form
      v-if="stage === 4"
      class="flex flex-col gap-6 p-6 bg-card border rounded-lg max-w-5xl mx-auto"
      @submit.prevent="uploadDataset"
    >
      <div class="grid grid-cols-5 gap-4 w-full">
        <div class="col-span-5 pb-2 mb-2 border-b">
          <div
            class="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground"
          >
            <div>Column</div>
            <div>Name</div>
            <div>Description</div>
            <div>Data Type</div>
            <div>Category</div>
          </div>
        </div>

        <template v-for="(column, index) in columns">
          <div class="flex items-center gap-2">
            <label
              class="text-sm truncate text-foreground"
              :for="column + '-' + index"
            >
              {{ names[index] }}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-primary"
              @click="() => showPreview(index)"
            >
              <Icon name="heroicons:eye" class="w-4 h-4" />
            </Button>
          </div>

          <Input
            :name="'name-' + index"
            placeholder="Name"
            v-model="names[index]"
            required
            autocomplete="off"
          />

          <Input
            :name="'description-' + index"
            placeholder="Description"
            v-model="descriptions[index]"
            required
            autocomplete="off"
          />

          <Select v-model="dataTypes[index]" :name="'type-' + index" required>
            <SelectTrigger class="w-full">
              <SelectValue
                :placeholder="dataTypes[index] || 'Select data type'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="datetime">Datetime</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="time">Time</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Dataset category"
            :name="'category-' + index"
            required
            v-model="categories[index]"
            autocomplete="off"
          />
        </template>
      </div>

      <div class="flex items-center w-full justify-between pt-4 border-t mt-2">
        <Button
          variant="outline"
          @click="resetStages"
          class="text-muted-foreground"
        >
          Cancel
        </Button>
        <div class="flex gap-2">
          <Button variant="outline" @click="previousStage">Previous</Button>
          <Button type="submit">Save Dataset</Button>
        </div>
      </div>
    </form>

    <!-- Preview Dialog -->
    <Dialog
      :open="previewIndex !== null"
      @update:open="(val: boolean) => !val && (previewIndex = null)"
    >
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{
            previewIndex !== null ? names[previewIndex] : ""
          }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-6">
          <div>
            <h3 class="font-medium text-foreground mb-3">Analysis Results</h3>
            <div class="bg-muted rounded-lg p-4">
              <p class="text-foreground">
                {{
                  previewIndex !== null
                    ? analysisResults[previewIndex].reasoning.mainReason
                    : ""
                }}
              </p>
              <ul class="mt-3 space-y-2">
                <li
                  v-for="(detail, i) in previewIndex !== null
                    ? analysisResults[previewIndex].reasoning.details
                    : []"
                  :key="i"
                  class="text-sm text-muted-foreground flex items-start"
                >
                  <span class="text-primary mr-2">•</span>
                  {{ detail }}
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-foreground mb-3">Sample Values</h3>
            <div class="bg-muted rounded-lg p-4">
              <ul class="space-y-2">
                <li
                  v-for="value in previewIndex !== null
                    ? analysisResults[previewIndex].sampleValues
                    : []"
                  class="text-sm text-muted-foreground font-mono truncate"
                >
                  {{ value }}
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-foreground mb-3">Statistics</h3>
            <div class="bg-muted rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-sm">
                  <span class="text-muted-foreground">Type:</span>
                  <span class="ml-1 text-foreground">{{
                    previewIndex !== null ? dataTypes[previewIndex] : ""
                  }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-muted-foreground">Format:</span>
                  <span class="ml-1 text-foreground">{{
                    previewIndex !== null ? categories[previewIndex] : ""
                  }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-muted-foreground">Confidence:</span>
                  <span class="ml-1 text-foreground">
                    {{
                      previewIndex !== null
                        ? (
                            analysisResults[previewIndex].confidence * 100
                          ).toFixed(1)
                        : ""
                    }}%
                  </span>
                </div>
                <div class="text-sm">
                  <span class="text-muted-foreground">Missing:</span>
                  <span class="ml-1 text-foreground">
                    {{
                      previewIndex !== null
                        ? (
                            analysisResults[previewIndex].missingValueRatio *
                            100
                          ).toFixed(1)
                        : ""
                    }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { ColumnAnalysis } from "~/utils/decisionTree";
import { detectDataTypes } from "~/utils/decisionTree";
import { analyzeDataset } from "~/utils/openai";

interface ColumnMetadata {
  name: string;
  description: string;
  dataType: string;
  category: string;
  confidence: number;
  reasoning: {
    mainReason: string;
    details: string[];
  };
}

interface AnalysisProgress {
  status: string;
  percent: number;
}

definePageMeta({
  layout: "dashboard",
});

const fileInput = ref<HTMLInputElement | null>(null);

const errorMessage = ref("");
const stage = ref(1);
const columns = ref<Array<string>>([]);
const useOpenAI = ref(false);

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

const analysisProgress = ref<AnalysisProgress>({
  status: "Analyzing your dataset...",
  percent: 0,
});

const previews = ref<Map<number, HTMLElement>>(new Map());

const handleDrop = (event: DragEvent) =>
  processFiles(event.dataTransfer?.files);
const handleInput = () => processFiles(fileInput.value?.files);

const showPreview = (index: number) => {
  previewIndex.value = index;
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
  const parsedData = await parseCsv({
    file: datasetFile,
    options: { start: 0, end: 6 }, // Get headers + 5 rows for analysis
  });

  columns.value = parsedData[0];
  analysisResults.value = detectDataTypes(fileContent);

  if (useOpenAI.value) {
    try {
      analysisProgress.value = {
        status: "Starting analysis...",
        percent: 0,
      };

      // Generate metadata and verify columns using ChatGPT
      const analysis = await analyzeDataset(
        datasetFile.name,
        parsedData,
        analysisResults.value,
        (progress: { status: string; percent: number }) => {
          analysisProgress.value = progress;
        }
      );

      // Update form fields with generated metadata
      datasetName.value = analysis.name;
      datasetDescription.value = analysis.description;

      // Update column information and analysis results
      names.value = analysis.columns.map((col: ColumnMetadata) => col.name);
      descriptions.value = analysis.columns.map(
        (col: ColumnMetadata) => col.description
      );
      dataTypes.value = analysis.columns.map(
        (col: ColumnMetadata) => col.dataType
      );
      categories.value = analysis.columns.map(
        (col: ColumnMetadata) => col.category
      );

      // Update analysis results with AI verification
      analysisResults.value = analysisResults.value.map((result, index) => ({
        ...result,
        dataType: analysis.columns[index].dataType,
        dataFormat: analysis.columns[index].category,
        confidence: analysis.columns[index].confidence,
        reasoning: analysis.columns[index].reasoning,
      }));

      analysisProgress.value = {
        status: "Analysis complete!",
        percent: 100,
      };
    } catch (error) {
      console.error("Error during dataset analysis:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      analysisProgress.value = {
        status: `Analysis failed: ${errorMessage}. Using basic analysis...`,
        percent: 0,
      };
      useDefaultAnalysis();
    }
  } else {
    useDefaultAnalysis();
  }

  // Add a small delay before moving to the next stage
  await new Promise((resolve) => setTimeout(resolve, 1000));
  nextStage();
};

const useDefaultAnalysis = () => {
  // Fallback to original behavior
  names.value = analysisResults.value.map(
    (result: ColumnAnalysis) => result.header
  );
  descriptions.value = columns.value.map(() => "");
  dataTypes.value = analysisResults.value.map((result: ColumnAnalysis) => {
    const columnName = result.header.toLowerCase();
    const isIdColumn = /\bid\b/.test(columnName);

    if (isIdColumn) {
      return result.dataType === "number" ? "number" : "string";
    }

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
    const columnName = result.header.toLowerCase();
    const isIdColumn = /\bid\b/.test(columnName);

    if (isIdColumn) {
      return "identifier";
    }

    return result.dataFormat === "unknown" ? "" : result.dataFormat;
  });
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

  try {
    const data = await $fetch("/api/datasets", {
      method: "POST",
      body: formData,
    });

    navigateTo(`/datasets/${data.id}`);
  } catch (error) {
    console.error("Error uploading dataset:", error);
  }
};

const handleClickOutside = (e: MouseEvent) => {
  if (
    previewIndex.value !== null &&
    !(e.target as HTMLElement).closest(".w-96") &&
    !(e.target as HTMLElement).closest("button")
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
