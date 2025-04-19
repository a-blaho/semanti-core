<template>
  <div
    v-if="dataset || isLoading"
    class="w-full py-8 px-16 grid grid-rows-[4rem_1fr] h-screen bg-background"
  >
    <div class="flex justify-between items-end w-full pb-2">
      <div>
        <div
          v-if="isLoading"
          class="h-4 w-32 bg-muted rounded animate-pulse mb-2"
        ></div>
        <div v-else>
          <p>{{ dataset?.owner.name }}</p>
          <h1 class="text-2xl font-bold">
            {{ dataset?.metadata.tables[0]["dc:title"] }}
          </h1>
        </div>
      </div>
      <div v-if="!isLoading">
        <DatasetStar :dataset-id="dataset?.id || ''" />
      </div>
    </div>
    <div class="overflow-auto">
      <Tabs default-value="general" class="w-full">
        <TabsList
          class="border-b border-border text-lg top-0 sticky bg-background w-full justify-start h-auto p-0"
        >
          <TabsTrigger
            value="general"
            class="px-8 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >General</TabsTrigger
          >
          <TabsTrigger
            value="preview"
            class="px-8 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >Preview</TabsTrigger
          >
          <TabsTrigger
            value="metadata"
            class="px-8 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >Metadata</TabsTrigger
          >
          <TabsTrigger
            v-if="isOwner"
            value="settings"
            class="px-8 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >Settings</TabsTrigger
          >
        </TabsList>
        <TabsContent value="general" class="pt-4 space-y-4">
          <div v-if="isLoading" class="space-y-4">
            <div class="border rounded-lg p-6">
              <div class="h-6 w-48 bg-muted rounded animate-pulse mb-4"></div>
              <div class="h-24 bg-muted rounded animate-pulse"></div>
            </div>
            <div class="border rounded-lg p-6">
              <div class="h-6 w-48 bg-muted rounded animate-pulse mb-4"></div>
              <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                <div v-for="i in 4" :key="i">
                  <div
                    class="h-4 w-24 bg-muted rounded animate-pulse mb-2"
                  ></div>
                  <div class="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div class="border rounded-lg p-6">
              <div class="h-6 w-48 bg-muted rounded animate-pulse mb-4"></div>
              <div class="space-y-4">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="border-b pb-4 last:border-0 last:pb-0"
                >
                  <div
                    class="h-5 w-32 bg-muted rounded animate-pulse mb-2"
                  ></div>
                  <div
                    class="h-4 w-full bg-muted rounded animate-pulse mb-2"
                  ></div>
                  <div class="flex gap-4">
                    <div class="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    <div class="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="border rounded-lg p-6">
              <h2 class="text-xl font-bold mb-4">Description</h2>
              <p class="text-lg text-muted-foreground">
                {{ dataset?.metadata.tables[0]["dc:description"] }}
              </p>
            </div>
            <div class="border rounded-lg p-6">
              <h2 class="text-xl font-bold mb-4">Dataset Information</h2>
              <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h3 class="font-semibold">Size</h3>
                  <p class="text-muted-foreground">
                    {{ formatBytes(dataset?.size || 0) }}
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold">Columns</h3>
                  <p class="text-muted-foreground">
                    {{ dataset?.metadata.tables[0].tableSchema.columns.length }}
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold">Access</h3>
                  <p class="text-muted-foreground">
                    {{ dataset?.public ? "Public" : "Private" }}
                  </p>
                </div>
                <div>
                  <h3 class="font-semibold">Owner</h3>
                  <p class="text-muted-foreground">{{ dataset?.owner.name }}</p>
                </div>
              </div>
            </div>
            <div class="border rounded-lg p-6">
              <h2 class="text-xl font-bold mb-4">Schema Overview</h2>
              <div class="space-y-4">
                <div
                  v-for="column in dataset?.metadata.tables[0].tableSchema
                    .columns"
                  class="border-b pb-4 last:border-0 last:pb-0"
                >
                  <h3 class="font-semibold">
                    {{ column["dc:title"] }}
                  </h3>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ column["dc:description"] }}
                  </p>
                  <div class="flex gap-4 mt-2 text-sm">
                    <span class="text-muted-foreground">
                      <span class="font-medium">Type:</span>
                      {{ column.datatype.base }}
                    </span>
                    <span
                      class="text-muted-foreground"
                      v-if="column.datatype.format"
                    >
                      <span class="font-medium">Format:</span>
                      {{ column.datatype.format }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </TabsContent>
        <TabsContent value="preview" class="pt-4">
          <div v-if="isLoading" class="space-y-4">
            <div class="flex justify-end">
              <div class="h-10 w-48 bg-muted rounded animate-pulse"></div>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <div class="min-w-full">
                  <div class="h-10 bg-muted animate-pulse"></div>
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="h-12 bg-muted/50 animate-pulse"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="flex justify-end gap-2 mb-4">
              <Button
                @click="downloadDataset()"
                variant="default"
                class="flex items-center gap-2"
              >
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
                Download CSV ({{ formatBytes(dataset?.size || 0) }})
              </Button>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        v-for="column in dataset?.metadata.tables[0].tableSchema
                          .columns"
                      >
                        {{ column["titles"] }}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="row in rows">
                      <TableCell
                        v-for="item in row"
                        class="font-mono whitespace-nowrap"
                      >
                        {{ item }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </template>
        </TabsContent>
        <TabsContent value="metadata" class="pt-4">
          <div v-if="isLoading" class="space-y-4">
            <div class="flex justify-end">
              <div class="h-10 w-48 bg-muted rounded animate-pulse"></div>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <div
                class="bg-muted px-6 py-3 border-b flex justify-between items-center"
              >
                <div class="h-4 w-32 bg-muted/50 rounded animate-pulse"></div>
                <div class="flex gap-2">
                  <div class="h-8 w-8 bg-muted/50 rounded animate-pulse"></div>
                  <div class="h-8 w-8 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div class="p-6">
                <div class="h-[500px] bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="flex justify-end gap-2 mb-4">
              <Button
                @click="downloadMetadata()"
                variant="default"
                class="flex items-center gap-2"
              >
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
                Download metadata
              </Button>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <div
                class="bg-muted px-6 py-3 border-b flex justify-between items-center"
              >
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold">Raw Metadata</h3>
                  <span
                    v-if="isEditing"
                    class="text-xs text-primary font-medium"
                  >
                    (Editing)
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="!isEditing"
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    @click="copyToClipboard"
                  >
                    <Icon name="heroicons:clipboard" class="w-4 h-4" />
                  </Button>
                  <Button
                    v-if="isOwner"
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    :class="{ 'text-primary': isEditing }"
                    @click="isEditing ? saveMetadata() : (isEditing = true)"
                    :disabled="isEditing && !hasMetadataChanges"
                  >
                    <Icon
                      :name="
                        isEditing
                          ? 'heroicons:check'
                          : 'heroicons:pencil-square'
                      "
                      class="w-4 h-4"
                    />
                  </Button>
                  <Button
                    v-if="isEditing"
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    @click="cancelEditing"
                  >
                    <Icon name="heroicons:x-mark" class="w-4 h-4" />
                  </Button>
                  <p v-if="metadataError" class="text-sm text-destructive">
                    {{ metadataError }}
                  </p>
                </div>
              </div>
              <div class="p-6">
                <textarea
                  v-model="editableMetadata"
                  :disabled="!isEditing || !isOwner"
                  class="w-full h-[500px] font-mono text-sm p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                  @input="validateMetadata"
                ></textarea>
              </div>
            </div>
          </template>
        </TabsContent>
        <TabsContent v-if="isOwner" value="settings" class="pt-4">
          <div v-if="isLoading" class="border rounded-lg p-6 space-y-6">
            <div class="h-6 w-48 bg-muted rounded animate-pulse mb-6"></div>
            <div class="space-y-6">
              <div>
                <div class="h-5 w-32 bg-muted rounded animate-pulse mb-4"></div>
                <div class="flex items-center gap-4">
                  <div class="h-6 w-12 bg-muted rounded animate-pulse"></div>
                  <div class="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </div>
                <div class="mt-2 h-4 w-48 bg-muted rounded animate-pulse"></div>
              </div>
              <div>
                <div class="h-5 w-32 bg-muted rounded animate-pulse mb-4"></div>
                <div
                  class="border border-destructive/20 rounded-lg p-4 bg-destructive/5"
                >
                  <div
                    class="h-5 w-32 bg-muted rounded animate-pulse mb-2"
                  ></div>
                  <div
                    class="h-4 w-64 bg-muted rounded animate-pulse mb-4"
                  ></div>
                  <div class="h-10 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="border rounded-lg p-6">
              <h2 class="text-xl font-bold mb-6">Dataset Settings</h2>
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-medium mb-4">Access Control</h3>
                  <div class="flex items-center gap-4">
                    <label
                      class="relative inline-flex items-center cursor-pointer"
                    >
                      <Switch
                        v-model="isPublic"
                        @update:model-value="togglePublicAccess"
                      />
                    </label>
                    <span class="text-sm font-medium">Make dataset public</span>
                  </div>
                  <p class="mt-2 text-sm text-muted-foreground">
                    {{
                      isPublic
                        ? "Anyone can view this dataset"
                        : "Only you can view this dataset"
                    }}
                  </p>
                </div>
                <div>
                  <h3 class="text-lg font-medium mb-4">Danger Zone</h3>
                  <div
                    class="border border-destructive/20 rounded-lg p-4 bg-destructive/5"
                  >
                    <h4 class="text-destructive font-medium mb-2">
                      Delete Dataset
                    </h4>
                    <p class="text-destructive/90 text-sm mb-4">
                      Once you delete a dataset, there is no going back. Please
                      be certain.
                    </p>
                    <Button variant="destructive" @click="confirmDelete">
                      Delete Dataset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </TabsContent>
      </Tabs>
    </div>
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Dataset</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this dataset? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false"
            >Cancel</Button
          >
          <Button variant="destructive" @click="handleDelete">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Papa from "papaparse";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Database } from "~/database.types";

definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient<Database>();
const route = useRoute();
const datasetId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : id;
});

const isOwner = ref(false);

const dataset = ref<null | {
  id: string;
  metadata: Metadata;
  owner: { name: string };
  size: number;
  public: boolean;
}>(null);
const rows = ref<any>([]);

const editableMetadata = ref("");
const metadataError = ref("");
const hasMetadataChanges = ref(false);
const isEditing = ref(false);
const isPublic = ref(false);
const showDeleteDialog = ref(false);

const isLoading = ref(true);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(editableMetadata.value);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
  }
};

const validateMetadata = () => {
  try {
    JSON.parse(editableMetadata.value);
    metadataError.value = "";
    hasMetadataChanges.value =
      editableMetadata.value !==
      JSON.stringify(dataset.value?.metadata, null, 2);
  } catch (e) {
    metadataError.value = "Invalid JSON format";
    hasMetadataChanges.value = false;
  }
};

const cancelEditing = () => {
  isEditing.value = false;
  editableMetadata.value = JSON.stringify(dataset.value?.metadata, null, 2);
  metadataError.value = "";
  hasMetadataChanges.value = false;
};

const saveMetadata = async () => {
  try {
    const updatedMetadata = JSON.parse(editableMetadata.value);
    const { error } = await client
      .from("datasets")
      .update({ metadata: updatedMetadata })
      .eq("id", datasetId.value);

    if (error) throw error;

    // Update local state
    if (dataset.value) {
      dataset.value.metadata = updatedMetadata;
    }
    hasMetadataChanges.value = false;
    isEditing.value = false;
  } catch (error) {
    metadataError.value =
      error instanceof Error ? error.message : "Failed to save metadata";
  }
};

const confirmDelete = async () => {
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  try {
    const filePath = `${datasetId.value}/${datasetId.value}.csv`;

    // Delete the CSV file from storage
    await client.storage.from("datasets").remove([filePath]);

    // Delete the dataset record from the database
    const { error } = await client
      .from("datasets")
      .delete()
      .eq("id", datasetId.value);

    if (error) throw error;

    // Navigate back to the dashboard
    navigateTo("/dashboard");
  } catch (error) {
    console.error("Error deleting dataset:", error);
    alert("Failed to delete dataset. Please try again.");
  } finally {
    showDeleteDialog.value = false;
  }
};

const downloadMetadata = async () => {
  const metadata = dataset.value?.metadata;
  if (!metadata) return;

  const blob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${datasetId.value}-metadata.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadDataset = async () => {
  const { data: url } = await client.storage
    .from("datasets")
    .createSignedUrl(`${datasetId.value}/${datasetId.value}.csv`, 60);

  if (!url) return;

  navigateTo(url.signedUrl, { external: true });
};

const togglePublicAccess = async () => {
  try {
    const { error } = await client
      .from("datasets")
      .update({ public: isPublic.value })
      .eq("id", datasetId.value);

    if (error) throw error;

    // Update local state
    if (dataset.value) {
      dataset.value.public = isPublic.value;
    }
  } catch (error) {
    console.error("Error updating dataset access:", error);
    // Revert the toggle if the update failed
    isPublic.value = !isPublic.value;
    alert("Failed to update dataset access. Please try again.");
  }
};

onMounted(async () => {
  try {
    const [{ data }, { data: datasetFile }] = await Promise.all([
      client
        .from("datasets")
        .select("id, owner ( name, id ), metadata, size, public")
        .eq("id", datasetId.value),

      client.storage
        .from("datasets")
        .download(`${datasetId.value}/${datasetId.value}.csv`),
    ]);

    if (data?.length) {
      const {
        data: { user },
      } = await client.auth.getUser();
      isOwner.value = user?.id === data[0].owner.id;

      dataset.value = {
        id: data[0].id,
        metadata: toMetadata(data[0].metadata),
        owner: {
          //@ts-ignore
          name: data[0].owner.name,
        },
        size: data[0].size,
        public: data[0].public,
      };
      // Initialize editable metadata
      editableMetadata.value = JSON.stringify(dataset.value.metadata, null, 2);
      // Initialize public status
      isPublic.value = dataset.value.public;
    }
    if (datasetFile) {
      const fileContent = await datasetFile.text();
      rows.value = Papa.parse<string[]>(fileContent, {
        header: false,
        skipEmptyLines: true,
        quoteChar: '"',
        escapeChar: '"',
      }).data.slice(1, 11);
    }
  } catch (error) {
    console.error("Error loading dataset:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>
