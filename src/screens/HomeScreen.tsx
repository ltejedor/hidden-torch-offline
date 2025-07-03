import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Lesson } from '../types';
import { DEMO_LESSONS } from '../data/lessons';
import { DownloadManager } from '../utils/downloadManager';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface LessonItemProps {
  lesson: Lesson;
  onDownload: (lesson: Lesson) => void;
  onPlay: (lesson: Lesson, localUri: string) => void;
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  onDownload,
  onPlay,
  isDownloaded,
  isDownloading,
  downloadProgress,
}) => {
  const handleButtonPress = () => {
    if (isDownloaded) {
      // Play the lesson
      onPlay(lesson, ''); // localUri will be fetched in onPlay
    } else {
      // Download the lesson
      onDownload(lesson);
    }
  };

  const getButtonText = () => {
    if (isDownloading) {
      return `Downloading... ${Math.round(downloadProgress * 100)}%`;
    }
    return isDownloaded ? 'Play' : 'Download';
  };

  const getButtonStyle = () => {
    if (isDownloading) {
      return [styles.button, styles.buttonDownloading];
    }
    return isDownloaded ? [styles.button, styles.buttonPlay] : [styles.button, styles.buttonDownload];
  };

  return (
    <View style={styles.lessonItem}>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDescription} numberOfLines={2}>
          {lesson.transcript.split('\n')[0]}
        </Text>
      </View>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handleButtonPress}
        disabled={isDownloading}
      >
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [downloadStates, setDownloadStates] = useState<{
    [key: string]: { isDownloaded: boolean; isDownloading: boolean; progress: number };
  }>({});

  const downloadManager = DownloadManager.getInstance();

  useEffect(() => {
    checkDownloadStates();
  }, []);

  const checkDownloadStates = async () => {
    const states: { [key: string]: { isDownloaded: boolean; isDownloading: boolean; progress: number } } = {};
    
    for (const lesson of DEMO_LESSONS) {
      const cachedLesson = await downloadManager.getCachedLesson(lesson.id);
      states[lesson.id] = {
        isDownloaded: !!cachedLesson,
        isDownloading: false,
        progress: 0,
      };
    }
    
    setDownloadStates(states);
  };

  const handleDownload = async (lesson: Lesson) => {
    try {
      // Set downloading state
      setDownloadStates(prev => ({
        ...prev,
        [lesson.id]: {
          ...prev[lesson.id],
          isDownloading: true,
          progress: 0,
        },
      }));

      await downloadManager.downloadVideo(lesson, (progress) => {
        setDownloadStates(prev => ({
          ...prev,
          [lesson.id]: {
            ...prev[lesson.id],
            progress,
          },
        }));
      });

      // Download completed
      setDownloadStates(prev => ({
        ...prev,
        [lesson.id]: {
          isDownloaded: true,
          isDownloading: false,
          progress: 1,
        },
      }));

      Alert.alert('Success', 'Video downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to download video. Please try again.');
      
      // Reset download state
      setDownloadStates(prev => ({
        ...prev,
        [lesson.id]: {
          ...prev[lesson.id],
          isDownloading: false,
          progress: 0,
        },
      }));
    }
  };

  const handlePlay = async (lesson: Lesson, _localUri: string) => {
    try {
      const cachedLesson = await downloadManager.getCachedLesson(lesson.id);
      if (cachedLesson) {
        navigation.navigate('Player', {
          localUri: cachedLesson.localUri,
          transcript: lesson.transcript,
          title: lesson.title,
        });
      } else {
        Alert.alert('Error', 'Video not found. Please download again.');
        // Reset the download state
        setDownloadStates(prev => ({
          ...prev,
          [lesson.id]: {
            ...prev[lesson.id],
            isDownloaded: false,
          },
        }));
      }
    } catch (error) {
      console.error('Play failed:', error);
      Alert.alert('Error', 'Failed to play video.');
    }
  };

  const renderLessonItem = ({ item }: { item: Lesson }) => {
    const state = downloadStates[item.id] || { isDownloaded: false, isDownloading: false, progress: 0 };
    
    return (
      <LessonItem
        lesson={item}
        onDownload={handleDownload}
        onPlay={handlePlay}
        isDownloaded={state.isDownloaded}
        isDownloading={state.isDownloading}
        downloadProgress={state.progress}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Language Learning</Text>
        <Text style={styles.headerSubtitle}>Choose a lesson to start learning</Text>
      </View>
      <FlatList
        data={DEMO_LESSONS}
        renderItem={renderLessonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDownload: {
    backgroundColor: '#007bff',
  },
  buttonPlay: {
    backgroundColor: '#28a745',
  },
  buttonDownloading: {
    backgroundColor: '#ffc107',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 