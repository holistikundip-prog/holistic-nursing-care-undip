import React from 'react';
import { X, ExternalLink, Play, Clock, Sparkles } from 'lucide-react';
import { Video } from '../types';

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, isOpen, onClose }) => {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl border border-stone-700 relative overflow-hidden text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2 pr-4">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {video.category}
            </span>
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {video.duration}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Information Body */}
        <div className="p-5 sm:p-6 bg-stone-900 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {video.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
            {video.description}
          </p>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-stone-800 text-xs text-stone-400">
            <span>Pemateri / Sumber: <strong className="text-stone-200">{video.author || 'Tim Keperawatan Holistik'}</strong></span>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Buka di YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
