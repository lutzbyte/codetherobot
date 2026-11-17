export interface Vec {
  r: number;
  c: number;
}

/** 0 = utara (r-1), 1 = timur (c+1), 2 = selatan (r+1), 3 = barat (c-1). */
export type Direction = 0 | 1 | 2 | 3;

export type TileKind = "grass" | "path" | "void";

export type ObjectKind = "stone" | "crate" | "tree" | "gate" | "switch" | "star";

export interface LevelObject {
  id: string;
  kind: ObjectKind;
  at: Vec;
  /** Untuk switch: id gate yang dibuka atau ditutup. */
  linkedTo?: string;
}

export interface LevelDef {
  id: string;
  name: string;
  /** Satu string per baris. g = rumput, p = jalan, . = kosong (tidak bisa dilewati). */
  rows: readonly string[];
  start: Vec;
  startDir: Direction;
  goal: Vec;
  objects: readonly LevelObject[];
  requireAllStars?: boolean;
  /** Jumlah blok solusi referensi (batas untuk objective efisiensi). */
  parCommands: number;
  /** Jumlah aksi solusi referensi (batas untuk objective bonus tanpa bintang). */
  parSteps?: number;
  /** Tingkat kesulitan 1 sampai 5. */
  difficulty?: number;
  /** Batas jumlah instruksi (semua blok, termasuk di dalam fungsi). */
  maxInstructions?: number;
  /** Id command yang tersedia di palette. Default: command dasar. */
  allowedCommands?: readonly string[];
  /** Id fungsi yang tersedia, misalnya ["f1"]. */
  functions?: readonly string[];
  /** Nama variabel global yang tersedia. */
  variables?: readonly string[];
  /** Petunjuk singkat yang tampil di editor. */
  tutorial?: string;
}

export type RobotAction =
  | "forward"
  | "left"
  | "right"
  | "wait"
  | "collect"
  | "interact";

export type BlockReason = "edge" | "obstacle" | "gate";

export interface WorldSnapshot {
  pos: Vec;
  dir: Direction;
  collected: string[];
  openGates: string[];
}

export interface ActionResult {
  action: RobotAction;
  ok: boolean;
  reason?: BlockReason;
  collectedId?: string;
  toggledGateIds?: string[];
  complete: boolean;
  snapshot: WorldSnapshot;
}