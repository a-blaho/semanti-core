export interface ColumnAnalysis {
  header: string;
  dataType: string;
  dataFormat: string;
  confidence: number;
  missingValueRatio: number;
  stats: NumberStats | TextStats | null;
  sampleValues: string[];
  reasoning: {
    mainReason: string;
    details: string[];
  };
}

export interface NumberStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  skewness: number;
  modes: number[];
  modeFrequency: number;
  uniqueValueRatio: number;
}

export interface TextStats {
  avgLength: number;
  uniqueRatio: number;
  containsNumbers: boolean;
  containsSpecialChars: boolean;
}

export interface ColumnData {
  header: string;
  values: string[];
  missingValueRatio: number;
  sampleValues: string[];
}

export interface DecisionTreeNode {
  condition?: (data: ColumnData) => boolean;
  trueBranch?: DecisionTreeNode;
  falseBranch?: DecisionTreeNode;
  result?: ColumnAnalysis | ((data: ColumnData) => ColumnAnalysis);
}

export interface DecisionTree {
  root: DecisionTreeNode;
}
