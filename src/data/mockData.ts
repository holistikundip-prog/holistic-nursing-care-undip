import { Therapy, Video, LocationItem, Appointment, UserProfile, ClinicalProgressNote } from '../types';
import dryCuppingImg from '../assets/images/dry_cupping_therapy_1786825347903.jpg';

export const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: 'undip-nursing',
    name: 'Departemen Ilmu Keperawatan Universitas Diponegoro',
    address: 'Jl. Prof. Soedarto, SH, Tembalang, Kota Semarang, Jawa Tengah 50275',
    buildingRoom: 'Gedung Laboratorium Keperawatan Komplementer Lantai 2',
    city: 'Semarang'
  },
  {
    id: 'undip-dipocare',
    name: 'Dipocare Universitas Diponegoro',
    address: 'Kawasan Layanan Kesehatan Terpadu UNDIP, Tembalang, Kota Semarang',
    buildingRoom: 'Klinik Holistic & Complementary Nursing Care',
    city: 'Semarang'
  },
  {
    id: 'smpit-cahaya-ummat',
    name: 'SMPIT Cahaya Ummat Bergas Semarang',
    address: 'Jl. Lemah Abang No. 12, Krajan, Bergas Lor, Kec. Bergas, Kab. Semarang',
    buildingRoom: 'Unit Pelayanan Kesehatan & Edukasi Holistik',
    city: 'Kabupaten Semarang'
  }
];

export const INITIAL_THERAPIES: Therapy[] = [
  {
    id: 'head-massage',
    name: 'Head Massage',
    category: 'massage',
    tagline: 'Pijat kepala lembut untuk meredakan ketegangan dan meningkatkan kejernihan pikiran.',
    description: 'Terapi manipulasi jaringan lunak di area kulit kepala, leher, dan bahu untuk meningkatkan sirkulasi darah serta relaksasi saraf cranial.',
    definition: 'Head massage (pijat kepala) adalah bentuk terapi manual yang memfokuskan pemijatan, penekanan lembut, dan usapan ritmis pada kulit kepala, dahi, pelipis, dan dasar tengkorak.',
    benefits: [
      'Membantu meredakan ketegangan otot leher dan kepala',
      'Meningkatkan sirkulasi darah ke area kepala dan otak',
      'Membantu meningkatkan kualitas tidur dan mengatasi insomnia ringan',
      'Memberikan efek relaksasi yang mendalam dan menurunkan hormon stres',
      'Membantu mengurangi gejala sakit kepala tegang (tension headache)'
    ],
    indications: [
      'Ketegangan otot leher dan pundak akibat aktivitas kerja atau belajar',
      'Sakit kepala tegang (tension headache) non-akut',
      'Kelelahan mental dan stres emosional',
      'Kesulitan tidur / gangguan kualitas tidur'
    ],
    precautions: [
      'Gunakan tekanan yang lembut dan nyaman, sesuaikan dengan sensitivitas pasien',
      'Pastikan posisi pasien rileks (duduk bersandar atau berbaring nyaman)',
      'Hentikan pemijatan jika pasien merasa pusing mendadak atau mual'
    ],
    contraindications: [
      'Cedera kepala akut atau trauma leher yang belum dievaluasi dokter',
      'Infeksi atau luka terbuka pada kulit kepala',
      'Penyakit kulit menular di area kepala atau leher',
      'Tekanan darah sangat tinggi yang tidak terkontrol (hipertensi urgensi)'
    ],
    techniquesOrSteps: [
      'Pemberian usapan pembuka (effleurage) pada kulit kepala',
      'Pijatan sirkular menggunakan bantalan jari pada area temporal dan parietal',
      'Penekanan lembut titik akupresur di pelipis (Taiyang) dan belakang kepala (Fengchi)',
      'Gerakan relaksasi penutup pada area pundak dan leher'
    ],
    durationMinutes: 30,
    durationText: '30 Menit',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    iconName: 'Sparkles'
  },
  {
    id: 'back-massage',
    name: 'Back Massage',
    category: 'massage',
    tagline: 'Relaksasi otot punggung dan pereda kekakuan pasca aktivitas intensif.',
    description: 'Teknik usapan dan penekanan ritmis pada otot punggung dan paravertebra untuk memperlancar peredaran darah serta menurunkan spasme otot.',
    definition: 'Back massage adalah tindakan keperawatan holistik berupa manipulasi mekanik pada jaringan lunak punggung menggunakan minyak atau lotion relaksasi untuk memulihkan tonus otot yang tegang.',
    benefits: [
      'Mengurangi ketegangan dan rasa kaku pada otot punggung atas maupun bawah',
      'Melancarkan aliran darah dan oksigenasi ke jaringan paravertebral',
      'Memicu pelepasan hormon endorfin yang menimbulkan rasa nyaman dan rileks',
      'Membantu memperbaiki postur tubuh yang kaku akibat duduk lama',
      'Menurunkan respon kecemasan dan stres fisik'
    ],
    indications: [
      'Kekakuan otot punggung akibat posisi duduk yang monoton',
      'Nyeri punggung mekanik ringan hingga sedang tanpa defisit neurologis',
      'Kelelahan fisik menyeluruh setelah aktivitas berat',
      'Ketegangan psikosomatis yang terkumpul pada area punggung'
    ],
    precautions: [
      'Hindari penekanan keras langsung pada tulang belakang (vertebrae)',
      'Pastikan pasien berada dalam posisi tengkurap dengan penyangga bantal yang nyaman',
      'Periksa toleransi pasien terhadap minyak aromaterapi yang digunakan'
    ],
    contraindications: [
      'Fraktur atau dislokasi tulang belakang akut',
      'Hernia Nucleus Pulposus (HNP) fase akut berat dengan penjalaran nyeri',
      'Luka bakar, luka operasi terbuka, atau infeksi kulit punggung',
      'Riwayat trombosis vena dalam (DVT) atau gangguan pembekuan darah berat'
    ],
    techniquesOrSteps: [
      'Effleurage lembut merata ke seluruh permukaan punggung',
      'Petrissage (gerakan meremas lembut) pada otot trapezius dan latissimus dorsi',
      'Friction sirkular di sepanjang otot paravertebra',
      'Tapotement lembut dan usapan penenang akhir'
    ],
    durationMinutes: 45,
    durationText: '45 Menit',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80',
    iconName: 'Activity'
  },
  {
    id: 'foot-massage',
    name: 'Foot Massage',
    category: 'massage',
    tagline: 'Pijatan telapak dan pergelangan kaki untuk merelaksasi seluruh sistem tubuh.',
    description: 'Stimulasi titik refleks dan otot telapak kaki guna merangsang sirkulasi balik vena dan memberikan relaksasi menyeluruh.',
    definition: 'Foot massage adalah stimulasi mekanis pada area dorsum, plantar, tumit, dan pergelangan kaki yang mengintegrasikan teknik pemijatan lembut dan pemahaman titik refleks tubuh.',
    benefits: [
      'Memperbaiki sirkulasi darah di area ekstremitas bawah',
      'Membantu meredakan pegal dan pembengkakan ringan pasca berdiri lama',
      'Meningkatkan rasa rileks dan menurunkan kelelahan umum tubuh',
      'Membantu stimulasi saraf sensorik untuk kenyamanan kaki'
    ],
    indications: [
      'Kelelahan atau rasa pegal pada kaki setelah perjalanan jauh / berdiri lama',
      'Kecemasan dan ketegangan tubuh umum',
      'Rasa dingin pada ujung-ujung kaki akibat sirkulasi perifer yang lambat',
      'Sebagai terapi komplementer penunjang relaksasi'
    ],
    precautions: [
      'Gunakan tekanan yang proporsional pada titik-titik sensitif telapak kaki',
      'Gunakan krim atau minyak pelembab untuk mencegah gesekan kasar pada kulit',
      'Perhatikan adanya kapalan atau luka kecil sebelum memulai'
    ],
    contraindications: [
      'Ulkus diabetikum terbuka atau infeksi jamur/bakteri parah pada kaki',
      'Trombosis Vena Dalam (Deep Vein Thrombosis) aktif pada tungkai',
      'Fraktur atau cedera ligamen akut pada pergelangan/tulang kaki',
      'Gout arthritis fase inflamasi akut (radang sendi bengkak kemerahan)'
    ],
    techniquesOrSteps: [
      'Usapan hangat pada punggung dan telapak kaki',
      'Rotasi lembut sendi pergelangan kaki',
      'Penekanan ritmis pada area zona refleks telapak kaki',
      'Peregangan lembut jari-jari kaki'
    ],
    durationMinutes: 40,
    durationText: '40 Menit',
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
    iconName: 'Footprints'
  },
  {
    id: 'foot-spa',
    name: 'Foot Spa',
    category: 'spa',
    tagline: 'Rendaman herbal hangat dan perawatan kaki untuk kebersihan serta kesegaran holistik.',
    description: 'Terapi hidroterapi kaki menggunakan air hangat yang diperkaya garam mineral dan minyak esensial, dikombinasikan dengan eksfoliasi lembut.',
    definition: 'Foot Spa adalah prosedur keperawatan komplementer yang memadukan hidroterapi air hangat, aromaterapi, eksfoliasi ringan, dan pembersihan mendalam pada kaki guna merangsang relaksasi sistemik.',
    benefits: [
      'Membuka pori-pori dan melancarkan sirkulasi pembuluh darah perifer',
      'Membantu melembutkan kulit kering dan kapalan pada tumit',
      'Memberikan efek menenangkan dari uap aromaterapi herbal alami',
      'Menghilangkan aroma tidak sedap dan menyegarkan telapak kaki'
    ],
    indications: [
      'Kaki terasa lelah, kaku, atau kram ringan',
      'Kulit kaki kering dan membutuhkan hidrasi perawatan',
      'Kebutuhan relaksasi emosional setelah rutinitas harian yang padat'
    ],
    precautions: [
      'Periksa suhu air rendaman secara teliti (tidak melebihi 38-40°C) guna mencegah luka bakar termal',
      'Keringkan sela-sela jari kaki secara sempurna setelah tindakan untuk mencegah kelembaban jamur',
      'Gunakan garam spa yang tidak menimbulkan iritasi kulit'
    ],
    contraindications: [
      'Luka gangren atau luka terbuka diabetik pada kaki',
      'Neuropati perifer parah (gangguan sensasi rasa panas)',
      'Infeksi kulit menular aktif (misalnya selulitis aktif)'
    ],
    techniquesOrSteps: [
      'Pembersihan awal dan perendaman air hangat beraroma herbal (10-15 menit)',
      'Scrubbing lembut pada area tumit dan punggung kaki',
      'Pembilasan dengan air bersih dan pengeringan teliti',
      'Aplikasi lotion pelembab dengan pijatan ringan'
    ],
    durationMinutes: 45,
    durationText: '45 Menit',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    iconName: 'Droplets'
  },
  {
    id: 'dry-cupping',
    name: 'Dry Cupping',
    category: 'cupping',
    tagline: 'Terapi hisap cangkir kering untuk menstimulasi aliran limfatik dan meredakan spasme.',
    description: 'Aplikasi cangkir vakum pada titik meridian tubuh tanpa sayatan/perlukaan kulit untuk memicu mikrosirkulasi dan mengendurkan fasia otot.',
    definition: 'Dry cupping (bekam kering) adalah terapi fisik komplementer yang memanfaatkan tekanan negatif (hampa udara) di dalam cangkir khusus yang ditempelkan pada kulit, menciptakan tarikan lembut pada jaringan miofasial.',
    benefits: [
      'Meningkatkan perfusi darah lokal dan oksigenasi jaringan otot',
      'Membantu pelepasan adhesi jaringan miofasial yang kaku',
      'Merangsang jalur saraf sensorik dan sistem limfatik untuk eliminasi sisa metabolisme',
      'Meredakan rasa pegal dan masuk angin pada area punggung'
    ],
    indications: [
      'Kekakuan otot punggung, bahu, dan pinggang kronis',
      'Sensasi pegal linu dan rasa kedinginan pada otot punggung',
      'Titik nyeri trigger point yang terlokalisir'
    ],
    precautions: [
      'Tindakan HARUS dilakukan oleh perawat / tenaga kesehatan yang telah tersertifikasi pelatihan bekam',
      'Informasikan kepada pasien bahwa bekas hisapan melingkar (ekimosis/petechiae) wajar muncul dan akan hilang dalam 3-7 hari',
      'Pantau ketat respon kenyamanan pasien selama cup terpasang (durasi hisapan 5-10 menit per titik)'
    ],
    contraindications: [
      'Ibu hamil (terutama area perut, pinggang, dan punggung bawah)',
      'Pasien dengan gangguan pembekuan darah (hemofilia, ITP) atau konsumsi antikoagulan',
      'Kulit yang meradang, luka bakar, eksim, atau memiliki tahi lalat/tumor menonjol',
      'Kondisi tubuh sangat lemah atau demam tinggi akut'
    ],
    techniquesOrSteps: [
      'Pembersihan dan desinfeksi permukaan kulit punggung',
      'Pelumasan tipis minyak zaitun/herbal murni',
      'Penempatan cangkir bekam vakum pada titik-titik meridian aman',
      'Pembiaran hisapan vakum moderat selama 5-10 menit',
      'Pelepasan cangkir secara perlahan dan usapan minyak penenang'
    ],
    durationMinutes: 40,
    durationText: '40 Menit',
    image: dryCuppingImg,
    iconName: 'ShieldAlert',
    specialWarning: 'PERHATIAN KEAMANAN: Dry Cupping merupakan tindakan keperawatan komplementer yang WAJIB dilakukan oleh perawat terlatih dengan mengedepankan evaluasi kondisi vital pasien serta protokol pencegahan infeksi.'
  },
  {
    id: 'tai-chi',
    name: 'Tai Chi',
    category: 'exercise',
    tagline: 'Seni gerak lembut berbasis olah napas untuk keseimbangan, postur, dan ketenangan jiwa.',
    description: 'Latihan gerak tubuh dinamis lambat yang menyatukan pernapasan dalam, kesadaran pikiran, dan keseimbangan postural secara harmonis.',
    definition: 'Tai Chi adalah terapi latihan tubuh-pikiran (mind-body therapy) yang memadukan rangkaian gerakan terstruktur lambat, transfer berat badan terkontrol, dan meditasi gerak untuk meningkatkan energi vital serta kestabilan neuromuskular.',
    benefits: [
      'Meningkatkan keseimbangan tubuh dan menurunkan risiko jatuh',
      'Memperkuat otot tungkai bawah dan fleksibilitas persendian',
      'Meningkatkan kapasitas vital paru dan efisiensi pernapasan diafragma',
      'Mengurangi kadar kecemasan, menstabilkan denyut jantung dan tekanan darah',
      'Meningkatkan konsentrasi dan fokus kesadaran (mindfulness)'
    ],
    indications: [
      'Individu yang membutuhkan latihan fisik berdampak rendah (low-impact)',
      'Lansia atau dewasa dengan kebutuhan peningkatan stabilitas postur',
      'Kelelahan emosional dan stres kronis yang butuh ketenangan',
      'Rehabilitasi fisik ringan pasca pemulihan kesehatan'
    ],
    precautions: [
      'Gunakan pakaian yang longgar dan sepatu bertelapak datar yang fleksibel',
      'Lakukan pemanasan peregangan sendi sebelum memulai gerakan terstruktur',
      'Lakukan gerakan dalam batas kenyamanan tanpa memaksakan lutut atau pinggul'
    ],
    contraindications: [
      'Kondisi nyeri sendi akut yang meradang parah',
      'Penyakit jantung tidak stabil / angina pektoris yang belum terkompensasi',
      'Cedera akut pada tulang belakang atau sendi lutut yang baru terjadi',
      'Pusing berputar parah (vertigo akut)'
    ],
    techniquesOrSteps: [
      'Pernapasan diafragma tenang dan pemusatan pikiran (Zhan Zhuang)',
      'Gerakan dasar pembuka: Mengangkat tangan dan melangkah mengalir',
      'Gerakan transfer beban: "Parting the Wild Horse\'s Mane" & "Cloud Hands"',
      'Gerakan penutup dan penenangan napas harmonis'
    ],
    durationMinutes: 50,
    durationText: '50 Menit',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    iconName: 'Wind',
    scheduleNote: 'Jadwal Pelaksanaan Sesi: Khusus Tersedia pada Hari Jumat & Sabtu',
    allowedDays: [5, 6] // 5 = Jumat, 6 = Sabtu
  },
  {
    id: 'yoga',
    name: 'Yoga',
    category: 'exercise',
    tagline: 'Penyelarasan postur, pernapasan sadar, dan relaksasi pikiran untuk vitalitas holistik.',
    description: 'Praktik holistik terapeutik melalui asana (postur fisik lembut), pranayama (latihan napas), dan savasana (relaksasi) yang dipandu tenaga kesehatan.',
    definition: 'Yoga dalam keperawatan holistik adalah intervensi terapeutik tubuh-pikiran yang memfasilitasi integrasi fisik, mental, dan emosional melalui postur peregangan terarah dan regulasi sistem saraf otonom.',
    benefits: [
      'Meningkatkan kelenturan otot dan ruang gerak sendi (range of motion)',
      'Memperbaiki postur tubuh dan mengurangi nyeri leher/punggung ringan',
      'Menyeimbangkan sistem saraf simpatis dan parasimpatis untuk menenangkan detak jantung',
      'Membantu meningkatkan kualitas tidur dan kestabilan mood emosional'
    ],
    indications: [
      'Stres psikologis dan ketegangan fisik akibat beban kerja',
      'Kekakuan otot postural',
      'Kebutuhan pemeliharaan kebugaran dan pernapasan optimal',
      'Peningkatan kesadaran tubuh (body awareness)'
    ],
    precautions: [
      'Gunakan matras yoga yang tidak licin',
      'Dengarkan batas kemampuan tubuh sendiri, tidak memaksakan pose ekstrem',
      'Gunakan alat bantu seperti balok atau tali peregang jika dibutuhkan'
    ],
    contraindications: [
      'Cedera sendi atau otot akut yang sedang dalam fase radang',
      'Glaukoma berat atau peningkatan tekanan intraokular (hindari pose inversi)',
      'Hernia atau pasca operasi perut baru yang belum sembuh',
      'Penyakit kardiovaskular berat yang tidak terkontrol'
    ],
    techniquesOrSteps: [
      'Pranayama (latihan pernapasan kesadaran / nadi shodhana)',
      'Pemanasan gentle spinal stretch (Cat-Cow pose)',
      'Postur peregangan terapeutik (Child\'s Pose, Cobra Pose lembut, Gentle Bridge)',
      'Relaksasi dalam (Savasana) dengan afirmasi kesehatan'
    ],
    durationMinutes: 50,
    durationText: '50 Menit',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    iconName: 'HeartHandshake',
    scheduleNote: 'Jadwal Pelaksanaan Sesi: Khusus Tersedia pada Hari Jumat & Sabtu',
    allowedDays: [5, 6] // 5 = Jumat, 6 = Sabtu
  }
];

export const INITIAL_VIDEOS: Video[] = [
  {
    id: 'vid-foot-massage',
    title: 'Teknik dan Panduan Prosedur Foot Massage Komplementer',
    category: 'Massage',
    youtubeId: 'bRVXr5ujWDY',
    youtubeUrl: 'https://youtu.be/bRVXr5ujWDY?si=6mI6hyoMEaDRmIGQ',
    duration: '12:45',
    description: 'Video edukasi langkah demi langkah teknik pemijatan kaki, identifikasi titik tekan relaksasi, dan persiapan minyak untuk keperawatan komplementer.',
    thumbnail: 'https://img.youtube.com/vi/bRVXr5ujWDY/hqdefault.jpg',
    author: 'Tim Keperawatan Holistik'
  },
  {
    id: 'vid-head-massage',
    title: 'Pijat Kepala dan Leher (Head & Scalp Relaxation Therapy)',
    category: 'Massage',
    youtubeId: '1CgQ4X8SbOA',
    youtubeUrl: 'https://youtu.be/1CgQ4X8SbOA?si=a3eUh_zhJcdUZ31u',
    duration: '10:15',
    description: 'Demonstrasi pemijatan area kepala, pelipis, dan pangkal tengkorak untuk meredakan sakit kepala tegang serta menstimulasi gelombang alfa relaksasi.',
    thumbnail: 'https://img.youtube.com/vi/1CgQ4X8SbOA/hqdefault.jpg',
    author: 'Divisi Keperawatan Komplementer'
  },
  {
    id: 'vid-back-massage',
    title: 'Back Massage Therapy: Teknik Effleurage dan Petrissage Punggung',
    category: 'Massage',
    youtubeId: 'UMFw26BVbA8',
    youtubeUrl: 'https://youtu.be/UMFw26BVbA8?si=hDAjyVeFzCXB5lor',
    duration: '14:20',
    description: 'Panduan lengkap manipulasi jaringan otot punggung paravertebra untuk perawat dan tenaga kesehatan dalam mengurangi spasme otot pasien.',
    thumbnail: 'https://img.youtube.com/vi/UMFw26BVbA8/hqdefault.jpg',
    author: 'Pakar Keperawatan Fisik'
  },
  {
    id: 'vid-cupping-therapy',
    title: 'Standar Operasional Prosedur Cupping Therapy (Bekam Kering Aman)',
    category: 'Cupping',
    youtubeId: 'IOzaFTqt5wQ',
    youtubeUrl: 'https://youtu.be/IOzaFTqt5wQ?si=8AeYlCrMvoibtOR5',
    duration: '16:05',
    description: 'Prosedur keselamatan, penentuan titik meridian bekam kering, desinfeksi alat, serta edukasi pasca tindakan pada pasien.',
    thumbnail: 'https://img.youtube.com/vi/IOzaFTqt5wQ/hqdefault.jpg',
    author: 'Klinik Keperawatan Mandiri'
  },
  {
    id: 'vid-acupressure',
    title: 'Akupresur Mandiri untuk Mengurangi Ketegangan dan Mual',
    category: 'Akupresur',
    youtubeId: 'lJSUyMupfww',
    youtubeUrl: 'https://youtu.be/lJSUyMupfww?si=x-z5HkEFQQeZ55T1',
    duration: '09:30',
    description: 'Pembelajaran penekanan titik-titik akupresur utama tubuh (seperti PC6, LI4, dan ST36) untuk merangsang keseimbangan energi vital tubuh.',
    thumbnail: 'https://img.youtube.com/vi/lJSUyMupfww/hqdefault.jpg',
    author: 'Edukasi Holistik'
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'user-001',
  name: 'Bpk. Hendra Pratama, S.T.',
  patientNumber: 'HNC-PASIEN-2026081',
  phone: '0812-3456-7890',
  email: 'hendra.pratama@example.com',
  password: '1234',
  address: 'Jl. Banjarsari No. 45, Tembalang, Semarang',
  emergencyContact: '0813-9876-5432 (Ibu Ratna)',
  medicalNotes: 'Riwayat ketegangan otot leher akibat bekerja di depan laptop, tidak ada alergi minyak esensial.',
  joinedDate: '10 Agustus 2026'
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-001',
    bookingCode: 'HNC-2026-8912',
    userId: 'user-001',
    userName: 'Bpk. Hendra Pratama, S.T.',
    userEmail: 'hendra.pratama@example.com',
    userPhone: '0812-3456-7890',
    patientNumber: 'HNC-PASIEN-2026081',
    therapyId: 'head-massage',
    therapyName: 'Head Massage',
    locationId: 'undip-nursing',
    locationName: 'Departemen Ilmu Keperawatan Universitas Diponegoro',
    date: '2026-08-18',
    dayName: 'Selasa',
    timeSlot: '09:30',
    notes: 'Sering merasa tegang di tengkuk leher belakang.',
    status: 'Terjadwal',
    createdAt: '2026-08-14T09:00:00Z'
  },
  {
    id: 'app-002',
    bookingCode: 'HNC-2026-7734',
    userId: 'user-001',
    userName: 'Bpk. Hendra Pratama, S.T.',
    userEmail: 'hendra.pratama@example.com',
    userPhone: '0812-3456-7890',
    patientNumber: 'HNC-PASIEN-2026081',
    therapyId: 'back-massage',
    therapyName: 'Back Massage',
    locationId: 'undip-dipocare',
    locationName: 'Dipocare Universitas Diponegoro',
    date: '2026-08-20',
    dayName: 'Kamis',
    timeSlot: '14:00',
    notes: 'Kekakuan punggung bawah setelah tugas lapangan.',
    status: 'Menunggu',
    createdAt: '2026-08-15T08:30:00Z'
  },
  {
    id: 'app-003',
    bookingCode: 'HNC-2026-6211',
    userId: 'user-001',
    userName: 'Bpk. Hendra Pratama, S.T.',
    userEmail: 'hendra.pratama@example.com',
    userPhone: '0812-3456-7890',
    patientNumber: 'HNC-PASIEN-2026081',
    therapyId: 'foot-spa',
    therapyName: 'Foot Spa',
    locationId: 'undip-nursing',
    locationName: 'Departemen Ilmu Keperawatan Universitas Diponegoro',
    date: '2026-08-11',
    dayName: 'Selasa',
    timeSlot: '10:00',
    notes: 'Perawatan relaksasi mingguan.',
    status: 'Selesai',
    createdAt: '2026-08-08T10:00:00Z'
  }
];

// Available time slots from 08.00 to 19.30 with 30-minute interval
export const GENERATE_TIME_SLOTS = (): string[] => {
  const slots: string[] = [];
  const startHour = 8;
  const endHour = 19;
  
  for (let h = startHour; h <= endHour; h++) {
    const hourStr = h.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
    if (h !== 19 || true) {
      slots.push(`${hourStr}:30`);
    }
  }
  // 19:30 is included
  return slots;
};

export const INITIAL_PROGRESS_NOTES: ClinicalProgressNote[] = [
  {
    id: 'cpn-001',
    patientId: 'user-001',
    patientName: 'Bpk. Hendra Pratama, S.T.',
    patientNumber: 'HNC-PASIEN-2026081',
    patientPhone: '0812-3456-7890',
    patientEmail: 'hendra.pratama@example.com',
    appointmentId: 'app-003',
    bookingCode: 'HNC-2026-6211',
    therapyName: 'Foot Spa & Akupresur Relaksasi',
    visitDate: '2026-08-11',
    chiefComplaint: 'Kelelahan ekstrem pada kedua telapak kaki dan kram ringan saat malam hari setelah rutinitas pekerjaan yang padat.',
    assessment: 'Keadaan umum baik, kesadaran compos mentis. Skala nyeri (NRS) 4/10 di area plantar fascia. Tanda Vital: TD 125/80 mmHg, Nadi 76 x/menit, RR 18 x/menit. Tidak ada luka terbuka atau edema ekstremitas bawah.',
    vitalSigns: {
      bloodPressure: '125/80 mmHg',
      pulseRate: '76 x/menit',
      respiratoryRate: '18 x/menit',
      painScale: 4
    },
    intervention: '1. Perendaman kaki air hangat aromaterapi dengan garam magnesium & minyak esensial lavender (15 menit).\n2. Pijat akupresur pada titik Yongquan (KI1), Taichong (LR3), dan Zusanli (ST36) secara ritmik lembut (25 menit).\n3. Edukasi teknik peregangan otot betis mandiri dan asupan hidrasi air putih minimal 2 liter/hari.',
    progressFollowUp: 'Pasien merasa sangat rileks, ketegangan otot telapak kaki berkurang signifikan, skala nyeri menurun menjadi 1/10 pasca-tindakan. Pasien disarankan kontrol berkala lanjutan 1 minggu kemudian dan menjaga peregangan kaki rutin.',
    nurseName: 'Ns. Rahmat Hidayat, S.Kep.',
    createdAt: '2026-08-11T11:00:00Z'
  },
  {
    id: 'cpn-002',
    patientId: 'user-001',
    patientName: 'Bpk. Hendra Pratama, S.T.',
    patientNumber: 'HNC-PASIEN-2026081',
    patientPhone: '0812-3456-7890',
    patientEmail: 'hendra.pratama@example.com',
    appointmentId: 'app-001',
    bookingCode: 'HNC-2026-8912',
    therapyName: 'Head Massage & Terapi Relaksasi',
    visitDate: '2026-08-14',
    chiefComplaint: 'Kunjungan kontrol: Area tengkuk leher dan bahu terasa kaku serta kepala terasa berat akibat stres kerja di depan monitor.',
    assessment: 'Tampak ketegangan/spasme otot trapezius bilateral ringan-sedang. Skala nyeri 5/10. Tanda Vital: TD 128/82 mmHg, Nadi 80 x/menit, RR 19 x/menit. Pasien tampak lelah namun kooperatif.',
    vitalSigns: {
      bloodPressure: '128/82 mmHg',
      pulseRate: '80 x/menit',
      respiratoryRate: '19 x/menit',
      painScale: 5
    },
    intervention: '1. Terapi pemijatan kepala dan leher (Head Massage) dengan teknik effleurage dan petrissage lembut (30 menit).\n2. Penekanan titik relaksasi Fengchi (GB20), Jianjing (GB21), dan Yintang.\n3. Latihan pernapasan dalam (deep breathing exercise) 5 menit dengan aromaterapi peppermint.',
    progressFollowUp: 'Ketegangan otot leher melunak, sirkulasi kepala terasa lebih lancar, skala nyeri berkurang menjadi 2/10. Pasien merasa segar. Tindak lanjut: Pasien dijadwalkan sesi relaksasi lanjutan sesuai kebutuhan.',
    nurseName: 'Ns. Siti Fatimah, M.Kep.',
    createdAt: '2026-08-14T10:30:00Z'
  }
];

