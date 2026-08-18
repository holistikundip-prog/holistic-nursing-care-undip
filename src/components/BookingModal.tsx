<span className="text-stone-500">Catatan</span>
                    <span className="font-medium text-stone-700 text-right max-w-[65%] italic">
                      "{notes}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Berhasil / Sukses Booking & e-Tiket */}
          {step === 6 && createdAppointment && (
            <div className="text-center space-y-4 py-2 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  Pemesanan Berhasil
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-2">
                  Jadwal Tindakan Berhasil Dibuat!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Kode booking Anda telah diterbitkan. Silakan tunjukkan e-tiket ini kepada petugas saat registrasi di lokasi.
                </p>
              </div>

              {/* e-Ticket Box */}
              <div className="bg-stone-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-left space-y-3 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-emerald-100/60 pointer-events-none">
                  <QrCode className="w-32 h-32" />
                </div>

                <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-semibold block">Kode Booking</span>
                    <strong className="text-emerald-900 font-mono tracking-wider text-base">
                      {createdAppointment.bookingCode}
                    </strong>
                  </div>
                  <span className="text-xs bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-lg">
                    {createdAppointment.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Pasien:</span>
                    <span className="font-bold text-stone-800">{createdAppointment.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Terapi:</span>
                    <span className="font-bold text-emerald-800">{createdAppointment.therapyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Waktu:</span>
                    <span className="font-bold text-stone-800">
                      {createdAppointment.dayName}, {formatIndonesianDate(createdAppointment.date)} pukul {createdAppointment.timeSlot} WIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Lokasi:</span>
                    <span className="font-semibold text-stone-800 truncate max-w-[60%] text-right">
                      {createdAppointment.locationName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                if (step === 2 && preSelectedTherapy) {
                  onClose(); // If preselected, go back closes or stops
                } else {
                  setStep(step - 1);
                }
              }}
              className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 && (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 ml-auto cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi & Terbitkan Jadwal</span>
            </button>
          )}

          {step === 6 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToMyAppointments();
                }}
                className="flex-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4 text-emerald-300" />
                <span>Lihat Daftar Janji Temu Saya</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
