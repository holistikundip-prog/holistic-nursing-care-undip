import React, { useState, useMemo } from 'react';
import { Play, Clock, Search, Video as VideoIcon, Sparkles, ExternalLink } from 'lucide-react';
import { Video } from '../types';

interface VideoListViewProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
}

export const VideoListView: React.FC<VideoListViewProps> = ({ videos, onSelectVideo }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'Semua',
    'Massage',
    'Cupping',
    'Akupresur',
    'Relaksasi',
    'Mind-body therapy'
  ];

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesCat =
        selectedCategory === 'Semua' || v.category === selectedCategory;
      const matchesSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [videos, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-800/60 px-3 py-1 rounded-full border border-teal-500/40">
            Media Audio-Visual
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Video Pembelajaran Terapi Holistik
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 font-light leading-relaxed">
            Tonton demonstrasi prosedur klinis, teknik pemijatan, bekam kering aman, dan akupresur oleh tim keperawatan terlatih.
          </p>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Cari video edukasi terapi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-stone-600 hover:bg-emerald-50 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group"
          >
            {/* Thumbnail with Play Overlay */}
            <div
              onClick={() => onSelectVideo(video)}
              className="relative aspect-video w-full bg-stone-900 overflow-hidden cursor-pointer"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-emerald-500 transition">
                  <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {video.category}
              </div>

              <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-300" />
                {video.duration}
              </div>
            </div>

            {/* Video Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3
                  onClick={() => onSelectVideo(video)}
                  className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-emerald-800 transition cursor-pointer line-clamp-2"
                >
                  {video.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed font-light">
                  {video.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <span className="text-[11px] text-stone-400 truncate max-w-[140px]">
                  {video.author || 'Edukasi Holistik'}
                </span>

                <button
                  onClick={() => onSelectVideo(video)}
                  className="bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Tonton Video</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6">
          <p className="text-stone-500 text-sm">Tidak ditemukan video pada kategori ini.</p>
        </div>
      )}
    </div>
  );
};
