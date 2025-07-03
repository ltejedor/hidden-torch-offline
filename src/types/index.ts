export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  transcript: string;
}

export interface DownloadProgress {
  progress: number;
  lesson: Lesson;
}

export type RootStackParamList = {
  Home: undefined;
  Player: {
    localUri: string;
    transcript: string;
    title: string;
  };
  Downloads: undefined;
};

export interface CachedLesson {
  id: string;
  localUri: string;
  downloadedAt: string;
} 