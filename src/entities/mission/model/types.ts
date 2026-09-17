export interface Mission {
  id: string;
  topic: string;
  todo: string;
  deadline: string;
  isImportant: boolean;
  isCompleted: boolean;
  actualFocusMinutes: number | null;
}

export interface CreateMissionInput {
  topic: string;
  todo: string;
  deadline: string;
  isImportant: boolean;
}

export interface UpdateMissionInput {
  topic?: string;
  todo?: string;
  deadline?: string;
  isImportant?: boolean;
  isCompleted?: boolean;
}
