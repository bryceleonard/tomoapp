import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioStatus {
  isPlaying: boolean;
  progress: number; // 0 to 1
  duration: number; // in seconds
  currentTime: number; // in seconds
}

type ProgressCallback = (status: AudioStatus) => void;

class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private progressInterval: NodeJS.Timeout | null = null;
  private onProgressCallback: ProgressCallback | null = null;

  async play(audioUrl: string, onProgress?: ProgressCallback): Promise<void> {
    try {
      await this.cleanup();

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        this.handlePlaybackStatusUpdate
      );
      this.sound = newSound;
      this.onProgressCallback = onProgress || null;

      if (onProgress) {
        this.startProgressTracking();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.cleanup();
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this.onProgressCallback = null;
  }

  private startProgressTracking(): void {
    this.progressInterval = setInterval(async () => {
      if (!this.sound || !this.onProgressCallback) return;

      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const duration = status.durationMillis ?? 0;
        const currentTime = status.positionMillis;
        const progress = duration > 0 ? currentTime / duration : 0;

        this.onProgressCallback({
          isPlaying: status.isPlaying,
          progress,
          duration: duration / 1000,
          currentTime: currentTime / 1000,
        });
      }
    }, 100);
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      return;
    }

    if (status.didJustFinish) {
      this.stop();
    }
  };
}

// Create a singleton instance
const audioPlayer = new AudioPlayer();

// Export the instance methods
export const playAudio = (audioUrl: string, onProgress?: ProgressCallback) => 
  audioPlayer.play(audioUrl, onProgress);
export const pauseAudio = () => audioPlayer.pause();
export const stopAudio = () => audioPlayer.stop();
export const setVolume = (volume: number) => audioPlayer.setVolume(volume); 