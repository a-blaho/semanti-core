export interface Metadata {
  "@context": (string | { "@language": string; ai?: string; dt?: string })[];
  "@type"?: "Table" | "TableGroup";
  tables: [
    {
      "@type": "Table";
      url: string;
      "dc:title": string;
      "dc:description": string;
      tableSchema: {
        "@type": "Schema";
        columns: {
          name: string;
          titles: string | string[];
          "dc:title": string;
          "dc:description": string;
          datatype: {
            base: string;
            format?: string;
          };
          required?: boolean;
          suppressOutput?: boolean;
          "ai:reasoning"?: string;
          "dt:reasoning"?: string;
        }[];
        aboutUrl?: string;
        primaryKey?: string | string[];
        foreignKeys?: {
          columnReference: string | string[];
          reference: {
            resource: string;
            columnReference: string | string[];
          };
        }[];
      };
      dialect: {
        "@type"?: "Dialect";
        delimiter: string;
        encoding: string;
        header: boolean;
        headerRowCount: number;
        trim: boolean;
        skipRows?: number;
        skipColumns?: number;
        skipBlankRows?: boolean;
        skipInitialSpace?: boolean;
        lineTerminators?: string[];
        quoteChar?: string;
        doubleQuote?: boolean;
        commentPrefix?: string;
      };
      notes?: Array<{
        "@type": "Note";
        type?: string;
        body: string;
      }>;
    },
  ];
}

// Default CSVW metadata structure
const DEFAULT_METADATA: Metadata = {
  "@context": [
    "http://www.w3.org/ns/csvw",
    {
      "@language": "en",
      ai: "/api/ns/ai.jsonld#",
      dt: "/api/ns/decision-tree.jsonld#",
    },
  ],
  "@type": "TableGroup",
  tables: [
    {
      "@type": "Table",
      url: "",
      "dc:title": "",
      "dc:description": "",
      tableSchema: {
        "@type": "Schema",
        columns: [],
        aboutUrl: "",
      },
      dialect: {
        "@type": "Dialect",
        delimiter: ",",
        encoding: "utf-8",
        header: true,
        headerRowCount: 1,
        trim: false,
        doubleQuote: true,
        skipBlankRows: true,
        lineTerminators: ["\r\n", "\n"],
        quoteChar: '"',
      },
    },
  ],
};

/**
 * Ensures metadata follows the CSVW structure by providing defaults for missing fields
 * Only used when reading from database to ensure type safety
 */
export function toMetadata(metadata: any): Metadata {
  if (!metadata?.tables?.[0]) {
    return DEFAULT_METADATA;
  }

  // Since we're already saving in CSVW format, just ensure all required fields exist
  return {
    "@context": metadata["@context"] || DEFAULT_METADATA["@context"],
    "@type": metadata["@type"] || DEFAULT_METADATA["@type"],
    tables: [
      {
        ...DEFAULT_METADATA.tables[0],
        ...metadata.tables[0],
        tableSchema: {
          ...DEFAULT_METADATA.tables[0].tableSchema,
          ...metadata.tables[0].tableSchema,
          columns: metadata.tables[0].tableSchema.columns.map(
            (column: any) => ({
              ...column,
              "ai:reasoning": column["ai:reasoning"],
              "dt:reasoning": column["dt:reasoning"],
            })
          ),
        },
        dialect: {
          ...DEFAULT_METADATA.tables[0].dialect,
          ...metadata.tables[0].dialect,
        },
      },
    ],
  };
}
