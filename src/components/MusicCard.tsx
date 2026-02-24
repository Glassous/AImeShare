import React from 'react';
import { Play } from 'lucide-react';
import './MusicCard.css';

export interface Song {
  name: string;
  artist: string;
  album: string;
  url: string;
  pic: string;
  lrc: string;
}

interface MusicCardProps {
  songs: Song[];
  onPlay: (song: Song, allSongs: Song[]) => void;
}

const MusicCard: React.FC<MusicCardProps> = ({ songs, onPlay }) => {
  if (!songs || songs.length === 0) return null;

  return (
    <div className="music-card-container">
      <div className="music-list">
        {songs.map((song, index) => (
          <div 
            key={index} 
            className="music-item"
            onClick={() => onPlay(song, songs)}
          >
            <div className="music-item-cover">
              <img src={song.pic} alt={song.album} onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/50'}} />
              <div className="music-play-overlay">
                <Play size={16} fill="white" color="white" />
              </div>
            </div>
            <div className="music-item-info">
              <div className="music-item-name" title={song.name}>{song.name}</div>
              <div className="music-item-details" title={`${song.artist} - ${song.album}`}>
                {song.artist} - {song.album}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicCard;
