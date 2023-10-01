export interface Metadata {
  "@context": "http://www.w3.org/ns/csvw";
  url: string;
  "dc:title": string;
  "dc:description": string;
  tableSchema: {
    columns: {
      titles: string;
      "dc:title": string;
      "dc:description": string;
      datatype: string;
    }[];
  };
}

export function toMetadata(metadata: any): Metadata {
  return {
    "@context": "http://www.w3.org/ns/csvw",
    url: metadata.url as string,
    "dc:title": metadata["dc:title"] as string,
    "dc:description": metadata["dc:description"] as string,
    tableSchema: {
      columns: metadata.tableSchema.columns.map((column: any) => ({
        titles: column.titles as string,
        "dc:title": column["dc:title"] as string,
        "dc:description": column["dc:description"] as string,
        datatype: column.datatype as string,
      })),
    },
  };
}
