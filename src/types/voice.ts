export interface VoiceTask {
  action: string;
  target: string;
  name?: string;
  names?: string[];
  status?: string;
  position?: "first" | "last";
  positionIndex?: number;
  title?: string;
  description?: string;
  important?: boolean;
  page?: string;
  index?: number;
  meal?: string;
  food?: string;
  dateStr?: string;
  meals?: Record<string, string>;
  priority?: "low" | "medium" | "high";
  newTitle?: string;
  newDescription?: string;
  content?: string;
  theme?: "dark" | "light" | "toggle";
  query?: string;
}
