// Core data entities for embryo analysis

export type DevelopmentStage = 
  | 'tPB2'   // Second polar body extrusion
  | 'tPNa'   // Pronuclei appearance
  | 'tPNf'   // Pronuclei fading
  | 't2'     // 2-cell stage
  | 't3'     // 3-cell stage
  | 't4'     // 4-cell stage
  | 't5'     // 5-cell stage
  | 't8'     // 8-cell stage
  | 'tM'     // Morula
  | 'tSB'    // Start blastulation
  | 'tB'     // Blastocyst
  | 'tEB';   // Expanded blastocyst

export type DevelopmentSpeed = 'Slow' | 'Normal' | 'Fast';

export interface Frame {
  index: number;
  timeHours: number;
  imagePath: string;
  predictedStage: DevelopmentStage;
  confidence: number;
  morphologicalChange: number; // Frame-to-frame change magnitude
  anomalyFlag?: string;
}

export interface StageTransition {
  stage: DevelopmentStage;
  timeHours: number;
  isGroundTruth: boolean; // true = manual annotation, false = model prediction
}

export interface RiskFactor {
  name: string;
  impact: number; // -1 to 1, negative = reduces viability
  importance: number; // 0 to 1
}

export interface ModelOutput {
  viabilityScore: number; // 0-1
  confidence: number; // 0-100%
  riskFactors: RiskFactor[];
  sensitivityInsights: string[];
}

export interface Embryo {
  id: string;
  totalFrames: number;
  observationDurationHours: number;
  lastObservedStage: DevelopmentStage;
  timeToT2?: number;
  timeToT3?: number;
  timeToT5?: number;
  blastocystFormation: boolean;
  developmentSpeed: DevelopmentSpeed;
  modelOutput: ModelOutput;
  frames: Frame[];
  stageTransitions: StageTransition[];
}

export interface CohortData {
  cycleId: string;
  embryos: Embryo[];
}
