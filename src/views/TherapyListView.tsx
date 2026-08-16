import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Clock, ArrowRight, CalendarPlus, ShieldAlert, HeartHandshake, Info } from 'lucide-react';
import { Therapy, TherapyCategory } from '../types';

interface TherapyListViewProps {
  therapies: Therapy[];
  onOpenDetail: (therapy: Therapy) => void;
  onOpenBooking: (therapy: Therapy) => void;
}

export const TherapyListView: React.FC<TherapyListViewProps> = ({
  therapies,
  onOpenDetail,
  onOpenBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Semua Terapi' },
    { id: 'massage', label: 'Massage & Pijat' },
    { id: 'cupping', label: 'Dry Cupping (Bekam)' },
    { id: 'spa', label: 'Foot Spa' },
    { id: 'exercise', label: 'Olah Tubuh & Pikiran (Tai Chi / Yoga)' }
  ];

  const filteredTherapies = useMemo(() => {
    return therapies.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.benefits.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [therapies, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-700/60 px-3 py-1 rounded-full border border-emerald-500/40">
            Edukasi & Pilihan Terapi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Katalog Terapi Holistik
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-light leading-relaxed">
            Kenali pengertian, manfaat, indikasi, serta kontraindikasi setiap tindakan keperawatan holistik sebelum menjadwalkan sesi Anda.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama terapi, keluhan, atau manfaat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-stone-600 hover:bg-emerald-50 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Therapy Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTherapies.map((therapy) => (
          <div
            key={therapy.id}
            className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
          >
            <div className="relative h-48 w-full bg-stone-100">
              <img
                src={therapy.image}
                alt={therapy.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
                {therapy.scheduleNote && (
                  <span className="bg-amber-500 text-stone-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md">
                    Jumat & Sabtu
                  </span>
                )}
                <div className="bg-stone-900/80 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {therapy.durationText}
                </div>
              </div>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-xl font-extrabold">{therapy.name}</h3>
                <p className="text-xs text-stone-200 line-clamp-1">{therapy.tagline}</p>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {therapy.description}
                </p>

                {/* Schedule info for Friday & Saturday only */}
                {therapy.scheduleNote && (
                  <div className="text-xs text-amber-900 bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Jadwal Sesi: Khusus Hari <strong>Jumat & Sabtu</strong></span>
                  </div>
                )}

                {/* Key Benefits Preview */}
                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block">
                    Manfaat Utama:
                  </span>
                  <ul className="text-xs text-stone-700 space-y-1">
                    {therapy.benefits.slice(0, 2).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="line-clamp-1">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {therapy.specialWarning && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="line-clamp-1">Wajib dilakukan oleh nakes terlatih</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => onOpenDetail(therapy)}
                  className="flex-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl transition border border-stone-200 text-center cursor-pointer"
                >
                  Lihat Info Lengkap
                </button>
                <button
                  onClick={() => onOpenBooking(therapy)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Pilih Jadwal</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTherapies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6">
          <p className="text-stone-500 text-sm">Tidak ditemukan terapi dengan kata kunci tersebut.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-xs text-emerald-700 font-bold underline"
          >
            Reset Filter Pencarian
          </button>
        </div>
      )}
    </div>
  );
};
