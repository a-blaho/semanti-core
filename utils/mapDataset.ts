export type Dataset = {
  id: string;
  name: string;
  metadata: Metadata;
  size: number;
  owner: { name: string };
  public: boolean;
  created_at: string;
};

export function toDataset(dataset: any): Dataset {
  return {
    id: dataset.id,
    name: dataset.name,
    metadata: toMetadata(dataset.metadata),
    size: dataset.size,
    owner: { name: dataset.owner.name },
    public: dataset.public,
    created_at: dataset.created_at,
  };
}
