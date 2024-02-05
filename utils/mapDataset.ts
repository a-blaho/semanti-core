export type Dataset = {
  id: string;
  name: string;
  metadata: Metadata;
  size: number;
  owner: { name: string };
  public: boolean;
};

export function toDataset(dataset: any): Dataset {
  return {
    id: dataset.id,
    name: dataset.name,
    metadata: toMetadata(dataset.metadata),
    size: dataset.size,
    owner: { name: dataset.owner.name },
    public: dataset.public,
  };
}
