export interface Mission {
  id: string;
  topic: string;
  todo: string;
  deadline: string;
  isImportant: boolean;
  isCompleted: boolean;
  actualFocusMinutes: number | null;
  // shared/lib/demo-store.ts(스코프 밖)의 데모 데이터는 이 필드를 채우지 않으므로 optional로 둔다.
  overdueDays?: number;
}

export interface CreateMissionInput {
  topic: string;
  todo: string;
  deadline?: string;
  isImportant: boolean;
}

export interface UpdateMissionInput {
  topic?: string;
  todo?: string;
  deadline?: string;
  isImportant?: boolean;
  isCompleted?: boolean;
}
