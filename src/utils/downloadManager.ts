import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson, CachedLesson } from '../types';

export class DownloadManager {
  private static instance: DownloadManager;
  private activeDownloads: Map<string, FileSystem.DownloadResumable> = new Map();

  public static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  async downloadVideo(
    lesson: Lesson,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const localUri = `${FileSystem.documentDirectory}${lesson.id}.mp4`;
    
    // Check if already downloaded
    const cachedLesson = await this.getCachedLesson(lesson.id);
    if (cachedLesson) {
      return cachedLesson.localUri;
    }

    // Create download resumable
    const downloadResumable = FileSystem.createDownloadResumable(
      lesson.videoUrl,
      localUri,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const progress = totalBytesWritten / totalBytesExpectedToWrite;
        onProgress(progress);
      }
    );

    this.activeDownloads.set(lesson.id, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();
      if (result) {
        // Save to AsyncStorage
        await this.saveCachedLesson({
          id: lesson.id,
          localUri: result.uri,
          downloadedAt: new Date().toISOString(),
        });
        
        this.activeDownloads.delete(lesson.id);
        return result.uri;
      }
      throw new Error('Download failed');
    } catch (error) {
      this.activeDownloads.delete(lesson.id);
      throw error;
    }
  }

  async getCachedLesson(lessonId: string): Promise<CachedLesson | null> {
    try {
      const cached = await AsyncStorage.getItem(`lesson:${lessonId}`);
      if (cached) {
        const cachedLesson = JSON.parse(cached) as CachedLesson;
        // Check if file still exists
        const fileInfo = await FileSystem.getInfoAsync(cachedLesson.localUri);
        if (fileInfo.exists) {
          return cachedLesson;
        } else {
          // File was deleted, remove from cache
          await AsyncStorage.removeItem(`lesson:${lessonId}`);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached lesson:', error);
      return null;
    }
  }

  async getAllCachedLessons(): Promise<CachedLesson[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const lessonKeys = keys.filter(key => key.startsWith('lesson:'));
      const cachedLessons: CachedLesson[] = [];

      for (const key of lessonKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cachedLesson = JSON.parse(cached) as CachedLesson;
          // Verify file still exists
          const fileInfo = await FileSystem.getInfoAsync(cachedLesson.localUri);
          if (fileInfo.exists) {
            cachedLessons.push(cachedLesson);
          } else {
            // Clean up stale cache entry
            await AsyncStorage.removeItem(key);
          }
        }
      }

      return cachedLessons;
    } catch (error) {
      console.error('Error getting all cached lessons:', error);
      return [];
    }
  }

  private async saveCachedLesson(cachedLesson: CachedLesson): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `lesson:${cachedLesson.id}`,
        JSON.stringify(cachedLesson)
      );
    } catch (error) {
      console.error('Error saving cached lesson:', error);
    }
  }

  async deleteCachedLesson(lessonId: string): Promise<void> {
    try {
      const cachedLesson = await this.getCachedLesson(lessonId);
      if (cachedLesson) {
        // Delete file
        await FileSystem.deleteAsync(cachedLesson.localUri, { idempotent: true });
        // Remove from AsyncStorage
        await AsyncStorage.removeItem(`lesson:${lessonId}`);
      }
    } catch (error) {
      console.error('Error deleting cached lesson:', error);
    }
  }

  cancelDownload(lessonId: string): void {
    const downloadResumable = this.activeDownloads.get(lessonId);
    if (downloadResumable) {
      downloadResumable.cancelAsync();
      this.activeDownloads.delete(lessonId);
    }
  }
} 