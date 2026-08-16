import React from 'react';
import { Sparkles, ShieldCheck, UserCheck, Stethoscope, HeartHandshake, User, Users } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSafety: () => void;
  isAdmin: boolean;
  onRequestNakesAccess: () => void;
  onExitNakesMode: () => void;
  pendingAppointmentsCount: number;
  currentUser?: UserProfile;
  onOpenPatientAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSafety,
  isAdmin,
  onRequestNakesAccess,
  onExitNakesMode,
  pendingAppointmentsCount,
  currentUser,
  onOpenPatientAuth
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800/80 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Logo & Name */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-inner transform transition group-hover:scale-105">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                HOLISTIC NURSING CARE
              </span>
              {isAdmin && (
                <span className="bg-amber-400/90 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Nakes/Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-200/90 hidden sm:block leading-tight font-light">
              Perawatan Holistik untuk Keseimbangan Tubuh dan Pikiran
            </p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Patient Account Quick Indicator */}
          {!isAdmin && currentUser && onOpenPatientAuth && (
            <button
              onClick={onOpenPatientAuth}
              className="hidden lg:flex items-center gap-1.5 text-xs bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-full border border-emerald-700 transition cursor-pointer"
              title="Ganti / Masuk Akun Pasien"
            >
              <User className="w-3.5 h-3.5 text-emerald-300" />
              <span className="font-semibold truncate max-w-[120px]">{currentUser.name}</span>
            </button>
          )}

          {/* Safety Button */}
          <button
            onClick={onOpenSafety}
            className="flex items-center gap-1.5 text-xs bg-emerald-800/80 hover:bg-emerald-700/90 text-emerald-100 px-3 py-1.5 rounded-full border border-emerald-600/50 transition cursor-pointer"
            title="Edukasi Keselamatan Pasien"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline font-medium">Panduan Keselamatan</span>
            <span className="sm:hidden font-medium">Safety</span>
          </button>

          {/* Admin Switcher Toggle */}
          <button
            onClick={() => {
              if (isAdmin) {
                onExitNakesMode();
              } else {
                onRequestNakesAccess();
              }
            }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition cursor-pointer ${
              isAdmin
                ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-sm'
                : 'bg-emerald-800/50 text-emerald-200 border-emerald-700 hover:bg-emerald-700/60'
            }`}
            title="Beralih ke mode Tenaga Kesehatan / Admin"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">
              {isAdmin ? 'Mode Nakes' : 'Mode Pasien'}
            </span>
          </button>

          {/* Profile Avatar button */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition relative cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-400 text-emerald-950 border-white'
                : 'bg-emerald-800 text-emerald-100 border-emerald-600 hover:bg-emerald-700'
            }`}
            title="Profil Pengguna"
          >
            <UserCheck className="w-4 h-4" />
            {pendingAppointmentsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-emerald-950 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-emerald-900">
                {pendingAppointmentsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
