import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CachedLesson } from '../types';
import { DownloadManager } from '../utils/downloadManager';
import { DEMO_LESSONS } from '../data/lessons';

type DownloadsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Downloads'>;

interface DownloadedLessonItemProps {
  cachedLesson: CachedLesson;
  onPlay: (cachedLesson: CachedLesson) => void;
  onDelete: (cachedLesson: CachedLesson) => void;
}

const DownloadedLessonItem: React.FC<DownloadedLessonItemProps> = ({
  cachedLesson,
  onPlay,
  onDelete,
}) => {
  const lesson = DEMO_LESSONS.find(l => l.id === cachedLesson.id);
  const downloadDate = new Date(cachedLesson.downloadedAt).toLocaleDateString();

  return (
    <View style={styles.lessonItem}>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{lesson?.title || 'Unknown Lesson'}</Text>
        <Text style={styles.lessonDate}>Downloaded: {downloadDate}</Text>
        {lesson && (
          <Text style={styles.lessonDescription} numberOfLines={2}>
            {lesson.transcript.split('\n')[0]}
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.playButton]}
          onPress={() => onPlay(cachedLesson)}
        >
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => onDelete(cachedLesson)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const DownloadsScreen: React.FC = () => {
  const navigation = useNavigation<DownloadsScreenNavigationProp>();
  const [cachedLessons, setCachedLessons] = useState<CachedLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const downloadManager = DownloadManager.getInstance();

  const loadCachedLessons = async () => {
    try {
      setIsLoading(true);
      const lessons = await downloadManager.getAllCachedLessons();
      setCachedLessons(lessons);
    } catch (error) {
      console.error('Error loading cached lessons:', error);
      Alert.alert('Error', 'Failed to load downloaded lessons');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCachedLessons();
    }, [])
  );

  const handlePlay = (cachedLesson: CachedLesson) => {
    const lesson = DEMO_LESSONS.find(l => l.id === cachedLesson.id);
    if (lesson) {
      navigation.navigate('Player', {
        localUri: cachedLesson.localUri,
        transcript: lesson.transcript,
        title: lesson.title,
      });
    } else {
      Alert.alert('Error', 'Lesson data not found');
    }
  };

  const handleDelete = (cachedLesson: CachedLesson) => {
    const lesson = DEMO_LESSONS.find(l => l.id === cachedLesson.id);
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson?.title || 'this lesson'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await downloadManager.deleteCachedLesson(cachedLesson.id);
              setCachedLessons(prev => prev.filter(l => l.id !== cachedLesson.id));
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson');
            }
          },
        },
      ]
    );
  };

  const renderCachedLessonItem = ({ item }: { item: CachedLesson }) => (
    <DownloadedLessonItem
      cachedLesson={item}
      onPlay={handlePlay}
      onDelete={handleDelete}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Downloaded Lessons</Text>
      <Text style={styles.emptyStateDescription}>
        Download lessons from the home screen to watch them offline
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.emptyStateButtonText}>Browse Lessons</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading downloads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerSubtitle}>
          {cachedLessons.length} lesson{cachedLessons.length !== 1 ? 's' : ''} downloaded
        </Text>
      </View>
      {cachedLessons.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={cachedLessons}
          renderItem={renderCachedLessonItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    padding: 16,
  },
  lessonItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonContent: {
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  lessonDate: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 6,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  playButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
}); 