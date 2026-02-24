import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Download, Disc, Music, ListMusic } from 'lucide-react';
import type { Song } from './MusicCard';
import './MusicPlayerSidebar.css';

interface MusicPlayerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: Song;
  songList?: Song[];
  themeMode: 'light' | 'dark';
  width?: number; // percentage
  onWidthChange?: (width: number) => void;
}

interface LyricLine {
  time: number;
  text: string;
}

const parseLrc = (lrc: string): LyricLine[] => {
  const lines = lrc.split('\n');
  const lyrics: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      if (text) {
        lyrics.push({ time, text });
      }
    }
  });

  return lyrics;
};

const MusicPlayerSidebar: React.FC<MusicPlayerSidebarProps> = ({
  isOpen,
  onClose,
  initialSong,
  songList = [],
  themeMode,
  width = 40,
  onWidthChange
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Handle resizing
  useEffect(() => {
    if (!isResizing || !onWidthChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      // Calculate width percentage from right edge
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
      
      // Limit width between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, onWidthChange]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []); // Run once on mount

  // Update song when initialSong changes
  useEffect(() => {
    if (initialSong) {
      setCurrentSong(initialSong);
      if (audioRef.current) {
        audioRef.current.src = initialSong.url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Play failed", e));
      }
      // Parse lyrics
      if (initialSong.lrc) {
        setLyrics(parseLrc(initialSong.lrc));
      } else {
        setLyrics([]);
      }
    }
  }, [initialSong]);

  // Update active lyric index based on progress
  useEffect(() => {
    if (lyrics.length > 0) {
      let index = lyrics.findIndex(line => line.time > progress) - 1;
      if (index < 0) {
        // Check if we are past the last lyric
        if (progress >= lyrics[lyrics.length - 1].time) {
            index = lyrics.length - 1;
        } else {
            index = -1; // Before first lyric
        }
      }
      setActiveLyricIndex(index);
      
      // Auto-scroll lyrics
      if (showLyrics && lyricsContainerRef.current && index !== -1 && !userScrolling) {
        const activeElement = lyricsContainerRef.current.children[index] as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [progress, lyrics, showLyrics, userScrolling]);

  const handleScroll = () => {
    setUserScrolling(true);
    if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
        setUserScrolling(false);
    }, 5000);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handlePrev = () => {
    if (!currentSong || songList.length === 0) return;
    const currentIndex = songList.findIndex(s => s === currentSong);
    const prevIndex = (currentIndex - 1 + songList.length) % songList.length;
    const prevSong = songList[prevIndex];
    setCurrentSong(prevSong);
    if (audioRef.current) {
      audioRef.current.src = prevSong.url;
      audioRef.current.play().then(() => setIsPlaying(true));
    }
    if (prevSong.lrc) setLyrics(parseLrc(prevSong.lrc));
    else setLyrics([]);
  };

  const handleNext = () => {
    if (!currentSong || songList.length === 0) return;
    const currentIndex = songList.findIndex(s => s === currentSong);
    const nextIndex = (currentIndex + 1) % songList.length;
    const nextSong = songList[nextIndex];
    setCurrentSong(nextSong);
    if (audioRef.current) {
      audioRef.current.src = nextSong.url;
      audioRef.current.play().then(() => setIsPlaying(true));
    }
    if (nextSong.lrc) setLyrics(parseLrc(nextSong.lrc));
    else setLyrics([]);
  };

  const handleDownload = () => {
    if (currentSong) {
      const a = document.createElement('a');
      a.href = currentSong.url;
      a.download = `${currentSong.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLyricClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    setIsClosing(true);
    setTimeout(() => {
        onClose();
        setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div 
        className={`preview-sidebar-overlay ${isOpen && !isClosing ? 'open' : ''}`} 
        onClick={handleClose}
      />
      <div 
        className={`preview-sidebar ${isOpen && !isClosing ? 'open' : ''} ${isClosing ? 'closing' : ''} ${themeMode}`}
        style={{ width: isMobileView ? '100%' : `${width}%` }}
      >
        {!isMobileView && (
          <div 
            className="sidebar-resizer"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
        
        <div className="sidebar-header music-header">
          <div className="sidebar-title">
            <Music size={18} />
            <span>Music Player</span>
          </div>
          <button className="close-button" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="music-player-content">
            {currentSong && (
                <>
                    <div className="music-visual-area">
                        {showLyrics ? (
                            <div 
                                className="lyrics-container" 
                                ref={lyricsContainerRef}
                                onScroll={handleScroll}
                            >
                                {lyrics.length > 0 ? (
                                    lyrics.map((line, index) => (
                                        <div 
                                            key={index} 
                                            className={`lyric-line ${index === activeLyricIndex ? 'active' : ''}`}
                                            onClick={() => handleLyricClick(line.time)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {line.text}
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-lyrics">No lyrics available</div>
                                )}
                            </div>
                        ) : (
                            <div className="album-art-large">
                                <img src={currentSong.pic} alt={currentSong.album} onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300'} />
                            </div>
                        )}
                    </div>

                    <div className="music-controls-area">
                        <div className="music-info">
                            <h3 className="song-title">{currentSong.name}</h3>
                            <p className="song-artist">{currentSong.artist} - {currentSong.album}</p>
                        </div>

                        <div className="progress-bar-container">
                            <span className="time-current">{formatTime(progress)}</span>
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 0} 
                                value={progress} 
                                onChange={handleSeek}
                                className="seek-slider"
                            />
                            <span className="time-duration">{formatTime(duration)}</span>
                        </div>

                        <div className="control-buttons">
                            <button 
                                className="control-btn secondary" 
                                onClick={() => setShowLyrics(!showLyrics)}
                                title={showLyrics ? "Show Album Art" : "Show Lyrics"}
                            >
                                {showLyrics ? <Disc size={20} /> : <ListMusic size={20} />}
                            </button>
                            
                            <div className="playback-controls">
                                <button className="control-btn" onClick={handlePrev}>
                                    <SkipBack size={24} />
                                </button>
                                <button className="control-btn play-pause" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                                </button>
                                <button className="control-btn" onClick={handleNext}>
                                    <SkipForward size={24} />
                                </button>
                            </div>

                            <button className="control-btn secondary" onClick={handleDownload} title="Download">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </>
  );
};

export default MusicPlayerSidebar;
