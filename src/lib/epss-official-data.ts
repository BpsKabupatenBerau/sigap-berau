export interface OfficialIndicator {
  code: string;
  name: string;
  weight: number; // % within aspect
  totalWeight: number; // % in total IPS
  level1Criteria: string;
  level2Criteria: string;
  level3Criteria: string;
  level4Criteria: string;
  level5Criteria: string;
  notes?: string;
}

export interface OfficialAspect {
  code: string;
  name: string;
  weight: number; // % within domain
  indicators: OfficialIndicator[];
}

export interface OfficialDomain {
  code: string;
  name: string;
  weight: number; // % in total IPS
  description: string;
  aspects: OfficialAspect[];
}

export const OFFICIAL_EPSS_DOMAINS: OfficialDomain[] = [
  {
    code: "1",
    name: "Prinsip Satu Data Indonesia (SDI)",
    weight: 28,
    description:
      "Penerapan standar data statistik, metadata statistik baku, interoperabilitas data, serta penggunaan kode referensi dan data induk.",
    aspects: [
      {
        code: "101",
        name: "Standar Data Statistik",
        weight: 25,
        indicators: [
          {
            code: "10101",
            name: "Penerapan Standar Data Statistik",
            weight: 100,
            totalWeight: 7.0,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap untuk 2 kegiatan statistik sektoral yang dinilaikan, atau tidak ada.",
            level2Criteria:
              "1. Screenshot/dokumen Standar Data Statistik Nasional (SDSN) di Aplikasi Indah (indah.bps.go.id / ms-sds.web.bps.go.id) atau SK Kepala BPS tentang SDSN (atau ketetapan standar data instansi bila tidak lintas instansi).\n2. Buku pedoman/juknis/publikasi yang menggunakan SDSN.\n3. Screenshot halaman dokumen yang menampilkan SDSN.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan penerapan Standar Data Statistik di K/L/Pemda (Peraturan Satu Data, Pedoman Pelaksanaan Kegiatan, Petunjuk Teknis, atau SOP) beserta screenshot halaman terkait SDS.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 dari bukti dukung Level 3 tentang indikator yang dinilaikan (berita acara hasil reviu, notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan yang berisi screenshot atau berkas sebelum dan setelah perbaikan/penyempurnaan Standar Data Statistik berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Bukti penerapan SDS harus selaras dengan yang tercantum dalam dokumen kebijakan. Untuk Level 3 wajib menyertakan ringkasan dan penyebutan pasal/halaman yang mengatur operasionalisasi indikator.",
          },
        ],
      },
      {
        code: "102",
        name: "Metadata",
        weight: 25,
        indicators: [
          {
            code: "10201",
            name: "Penerapan Metadata Statistik",
            weight: 100,
            totalWeight: 7.0,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, relevan tetapi tidak lengkap dari 2 kegiatan statistik sektoral, atau tidak ada.",
            level2Criteria:
              "Screenshot Metadata Kegiatan (MS-Keg), Metadata Variabel (MS-Var), dan Metadata Indikator (MS-Ind) berstatus 'submit' dari Aplikasi Indah (indah.bps.go.id) untuk 2 kegiatan statistik yang dinilaikan, atau file MS-Keg, MS-Var, MS-Ind sesuai struktur dan format baku BPS.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan penerapan Metadata Statistik di K/L/Pemda (Peraturan Satu Data, Pedoman, Juknis, atau SOP) beserta screenshot halaman yang menjelaskan Metadata Statistik.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 dari bukti dukung Level 3 tentang penerapan Metadata Statistik (notula rapat/berita acara).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Metadata Statistik berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Sebaiknya menyertakan screenshot halaman dokumen kebijakan yang menjelaskan terkait Metadata Statistik.",
          },
        ],
      },
      {
        code: "103",
        name: "Interoperabilitas Data",
        weight: 25,
        indicators: [
          {
            code: "10301",
            name: "Penerapan Interoperabilitas Data",
            weight: 100,
            totalWeight: 7.0,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik sektoral, atau tidak ada.",
            level2Criteria:
              "1. Screenshot ketersediaan web service/API/sistem pertukaran data lainnya beserta dokumentasi API dan format data terbuka (misal JSON).\n2. Screenshot pendaftaran pada Katalog Nasional Layanan Interoperabilitas Data (LID).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan penerapan Interoperabilitas Data di K/L/Pemda (Peraturan Satu Data, Pedoman, Juknis, atau SOP) beserta screenshot halaman yang menjelaskan Interoperabilitas Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 dari bukti dukung Level 3 tentang Interoperabilitas Data (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Interoperabilitas Data berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Syarat minimum interoperabilitas: tersedia data yang dipertukarkan, tersedia dokumentasi API/mekanisme pertukaran data, dan disajikan dalam format terbuka (misal JSON). Jika hanya format JSON tanpa API/fitur pertukaran antar sistem tidak dapat diberikan Level 2.",
          },
        ],
      },
      {
        code: "104",
        name: "Kode Referensi dan Data Induk",
        weight: 25,
        indicators: [
          {
            code: "10401",
            name: "Penerapan Kode Referensi dan Data Induk",
            weight: 100,
            totalWeight: 7.0,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik sektoral, atau tidak ada.",
            level2Criteria:
              "1. Screenshot penggunaan kode referensi pada raw data.\n2. Screenshot penggunaan kode referensi pada penyajian data.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan penerapan Kode Referensi di K/L/Pemda (Peraturan Satu Data, Pedoman, Juknis, atau SOP).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 dari bukti dukung Level 3 tentang penerapan Kode Referensi (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Kode Referensi berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Kode referensi mencakup NIK, kode wilayah Kemendagri, kode wilayah kerja statistik BPS, kode fasyankes, Kode Referensi Indikator Pembangunan, KBLI, KBJI, KBKI, NIB, serta standar internasional.",
          },
        ],
      },
    ],
  },
  {
    code: "2",
    name: "Kualitas Data",
    weight: 24,
    description:
      "Penjaminan kualitas output dan proses statistik meliputi relevansi, akurasi, aktualitas dan ketepatan waktu, aksesibilitas, serta keterbandingan dan konsistensi.",
    aspects: [
      {
        code: "201",
        name: "Relevansi",
        weight: 21,
        indicators: [
          {
            code: "20101",
            name: "Relevansi Data terhadap Pengguna",
            weight: 60,
            totalWeight: 3.024,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen yang memuat informasi keselarasan data yang dibutuhkan dengan data yang dihasilkan oleh unit kerja penyelenggara kegiatan statistik (misal: laporan/publikasi disandingkan dengan identifikasi kebutuhan data).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan prosedur baku yang ditetapkan walidata/institusi dan berlaku untuk seluruh produsen data terkait relevansi data (SOP, SE, Juknis, dll).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi terkait proses relevansi data terhadap pengguna secara berkala (dua periode reviu untuk setiap kegiatan) oleh unit penerbit kebijakan/unit yang ditunjuk.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan relevansi data terhadap pengguna berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Untuk Level 4, reviu dilakukan atas proses relevansi (SOP, dsj), bukan semata-mata output.",
          },
          {
            code: "20102",
            name: "Proses Identifikasi Kebutuhan Data",
            weight: 40,
            totalWeight: 2.016,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen aktivitas identifikasi kebutuhan data untuk dua kegiatan statistik yang dievaluasi (misal: daftar data yang diperlukan atau laporan hasil kajian/survei kebutuhan data).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait identifikasi kebutuhan data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala (dua periode reviu untuk setiap kegiatan) terkait proses identifikasi kebutuhan data oleh unit penerbit kebijakan/unit yang ditunjuk.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan proses identifikasi kebutuhan data berdasarkan tindak lanjut reviu/evaluasi.",
          },
        ],
      },
      {
        code: "202",
        name: "Akurasi",
        weight: 16,
        indicators: [
          {
            code: "20201",
            name: "Penilaian Akurasi Data",
            weight: 100,
            totalWeight: 3.84,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen administrasi terkait kegiatan/aktivitas pembahasan akurasi data pada dua kegiatan yang dievaluasi (misal: laporan/dokumentasi pemeriksaan kelengkapan data, outlier, duplikasi, dsb).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait penilaian akurasi data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala (dua periode reviu untuk setiap kegiatan) terkait proses Penilaian Akurasi Data oleh unit penerbit kebijakan.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penilaian Akurasi Data berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Rapat yang membahas akurasi data secara khusus untuk kegiatan statistik tertentu dapat menjadi pemenuhan Level 2.",
          },
        ],
      },
      {
        code: "203",
        name: "Aktualitas dan Ketepatan Waktu",
        weight: 21,
        indicators: [
          {
            code: "20301",
            name: "Penjaminan Aktualitas Data",
            weight: 50,
            totalWeight: 2.52,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen perjanjian, nota kesepahaman, berita acara, atau dokumen kesepakatan lainnya dengan pengguna data bahwa data masih dibutuhkan dan disampaikan pada kurun waktu/lag tertentu.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Penjaminan Aktualitas Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Penjaminan Aktualitas Data (dua periode reviu untuk setiap kegiatan).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penjaminan Aktualitas Data berdasarkan tindak lanjut reviu/evaluasi.",
            notes:
              "Dibutuhkan persetujuan/kesepakatan dari pengguna data bahwa data disampaikan sesuai kurun waktu/lag yang disepakati.",
          },
          {
            code: "20302",
            name: "Pemantauan Ketepatan Waktu Diseminasi",
            weight: 50,
            totalWeight: 2.52,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen jadwal rencana rilis data dan laporan pelaksanaan monitoring Pemantauan Ketepatan Waktu Diseminasi pada dua kegiatan yang dievaluasi.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Pemantauan Ketepatan Waktu Diseminasi.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Pemantauan Ketepatan Waktu Diseminasi secara menyeluruh.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pemantauan Ketepatan Waktu Diseminasi berdasarkan tindak lanjut reviu/evaluasi.",
          },
        ],
      },
      {
        code: "204",
        name: "Aksesibilitas",
        weight: 21,
        indicators: [
          {
            code: "20401",
            name: "Ketersediaan Data untuk Pengguna Data",
            weight: 34,
            totalWeight: 1.7136,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen berupa publikasi atau tangkapan layar yang menunjukkan ketersediaan data dan metadata dari dua kegiatan statistik yang dievaluasi (di portal SDI, website instansi, atau buku publikasi).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Ketersediaan Data untuk Pengguna Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Ketersediaan Data untuk Pengguna Data (dua periode reviu untuk setiap kegiatan).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Ketersediaan Data untuk Pengguna Data berdasarkan tindak lanjut reviu/evaluasi.",
          },
          {
            code: "20402",
            name: "Akses Media Penyebarluasan Data",
            weight: 33,
            totalWeight: 1.6632,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Ragam media penyebarluasan data (situs/website resmi, portal data, media sosial resmi institusi, dsb) dari dua kegiatan statistik yang dievaluasi.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Akses Media Penyebarluasan Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Akses Media Penyebarluasan Data.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Akses Media Penyebarluasan Data berdasarkan tindak lanjut reviu/evaluasi.",
          },
          {
            code: "20403",
            name: "Penyediaan Format Data",
            weight: 33,
            totalWeight: 1.6632,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Penyediaan data dalam berbagai format terbuka (xlsx, csv, html, dan json) yang dapat digunakan oleh pengguna data dari dua kegiatan statistik yang dievaluasi.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Penyediaan Format Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Penyediaan Format Data.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penyediaan Format Data berdasarkan tindak lanjut reviu/evaluasi.",
          },
        ],
      },
      {
        code: "205",
        name: "Keterbandingan dan Konsistensi",
        weight: 21,
        indicators: [
          {
            code: "20501",
            name: "Keterbandingan Data",
            weight: 50,
            totalWeight: 2.52,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen publikasi/tabel yang menunjukkan adanya keterbandingan data baik antar waktu (time series) maupun antar wilayah (cross section).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Keterbandingan Data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Keterbandingan Data.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Keterbandingan Data berdasarkan tindak lanjut reviu/evaluasi.",
          },
          {
            code: "20502",
            name: "Konsistensi Statistik",
            weight: 50,
            totalWeight: 2.52,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen yang menunjukkan kemampuan data untuk diperbandingkan dan digunakan bersama dengan sumber data lain secara konsisten.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) terkait Konsistensi Statistik.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi berkala terkait proses Konsistensi Statistik.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Konsistensi Statistik berdasarkan tindak lanjut reviu/evaluasi.",
          },
        ],
      },
    ],
  },
  {
    code: "3",
    name: "Proses Bisnis Statistik",
    weight: 19,
    description:
      "Penerapan tahapan Generic Statistical Business Process Model (GSBPM) mulai dari perencanaan data, pengumpulan data, pemeriksaan data, hingga penyebarluasan data.",
    aspects: [
      {
        code: "301",
        name: "Perencanaan Data",
        weight: 32,
        indicators: [
          {
            code: "30101",
            name: "Pendefinisian Kebutuhan Data",
            weight: 33,
            totalWeight: 2.0064,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Dokumen aktivitas Pendefinisian Kebutuhan Data berkaitan dengan dua kegiatan statistik yang dievaluasi (KAK kegiatan atau TOR yang memuat poin penjelasan sebagaimana dalam metadata kegiatan).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, atau SOP) pelaksanaan pendefinisian kebutuhan data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi secara berkala tentang pendefinisian kebutuhan data (minimal dua kali).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pendefinisian Kebutuhan Data berdasarkan tindak lanjut reviu/evaluasi.",
          },
          {
            code: "30102",
            name: "Desain Statistik",
            weight: 33,
            totalWeight: 2.0064,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "1. Dokumen aktivitas pelaksanaan desain statistik berkaitan dengan dua kegiatan statistik yang dievaluasi.\n2. Dokumen pemberitahuan rancangan kegiatan statistik dan rekomendasi yang telah disetujui (memuat bagian desain statistik).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, atau SOP) pelaksanaan aktivitas desain statistik.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi secara berkala terkait desain statistik (minimal dua kali).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Desain Statistik berdasarkan tindak lanjut reviu/evaluasi.",
          },
          {
            code: "30103",
            name: "Penyiapan Instrumen",
            weight: 34,
            totalWeight: 2.0672,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "1. Dokumen aktivitas Penyiapan Instrumen berkaitan dengan dua kegiatan statistik yang dievaluasi.\n2. Instrumen kegiatan statistik seperti kuesioner, form pendataan, atau pedoman pencacahan.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, atau SOP) pelaksanaan penyiapan instrumen.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi secara berkala terkait penyiapan instrumen (minimal dua kali).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan instrumen berdasarkan tindak lanjut reviu/evaluasi.",
          },
        ],
      },
      {
        code: "302",
        name: "Pengumpulan Data",
        weight: 26,
        indicators: [
          {
            code: "30201",
            name: "Proses Pengumpulan Data/Akuisisi Data",
            weight: 100,
            totalWeight: 4.94,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Laporan/dokumen formal yang menunjukkan adanya aktivitas pengumpulan data/akuisisi data pada masing-masing kegiatan statistik yang dievaluasi.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen yang menunjukkan pengelolaan/standarisasi aktivitas pengumpulan data/akuisisi data di lingkungan K/L/Pemda (peraturan, pedoman, SOP, dsj).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi terhadap proses pengumpulan data/akuisisi data secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Bukti perbaikan tata kelola pengumpulan data/akuisisi data untuk dua kegiatan yang dinilaikan berdasarkan hasil reviu dan evaluasi.",
          },
        ],
      },
      {
        code: "303",
        name: "Pemeriksaan Data",
        weight: 21,
        indicators: [
          {
            code: "30301",
            name: "Pengolahan Data",
            weight: 50,
            totalWeight: 1.995,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Laporan/dokumen formal yang menunjukkan adanya aktivitas pengolahan data (editing, coding, entry, validasi, tabulasi) pada masing-masing kegiatan statistik.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen pengelolaan/standarisasi aktivitas pengolahan data di lingkungan K/L/Pemda (SOP/Pedoman).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi terhadap proses Pengolahan Data secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen yang menunjukkan perbaikan tata kelola pengolahan data berdasarkan hasil reviu dan evaluasi.",
          },
          {
            code: "30302",
            name: "Analisis Data",
            weight: 50,
            totalWeight: 1.995,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Laporan/dokumen formal yang menunjukkan adanya aktivitas proses analisis data (deskriptif/inferensial/komparatif) pada masing-masing kegiatan statistik.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen pengelolaan/standarisasi aktivitas proses analisis data di lingkungan K/L/Pemda.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi terhadap proses Analisis Data secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Bukti perbaikan tata kelola proses analisis data berdasarkan hasil reviu dan evaluasi.",
          },
        ],
      },
      {
        code: "304",
        name: "Penyebarluasan Data",
        weight: 21,
        indicators: [
          {
            code: "30401",
            name: "Diseminasi Data",
            weight: 100,
            totalWeight: 3.99,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap dari 2 kegiatan statistik, atau tidak ada.",
            level2Criteria:
              "Laporan/dokumen formal yang menunjukkan adanya aktivitas proses diseminasi data pada masing-masing kegiatan statistik.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen pengelolaan/standarisasi aktivitas proses diseminasi data di lingkungan K/L/Pemda.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen pelaksanaan reviu dan evaluasi terhadap proses Diseminasi Data secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Bukti perbaikan tata kelola proses diseminasi data berdasarkan hasil reviu dan evaluasi.",
          },
        ],
      },
    ],
  },
  {
    code: "4",
    name: "Kelembagaan",
    weight: 17,
    description:
      "Penguatan kelembagaan statistik sektoral mencakup profesionalitas penyelenggara, pemenuhan SDM bidang statistik dan manajemen data, serta pengorganisasian statistik dan Forum SDI.",
    aspects: [
      {
        code: "401",
        name: "Profesionalitas",
        weight: 35,
        indicators: [
          {
            code: "40101",
            name: "Penjaminan Transparansi Informasi Statistik",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "1. Dokumen metadata kegiatan statistik yang memuat cara pengumpulan, sumber data, konsep, dan metodologi yang dapat diakses publik.\n2. Dokumen perubahan metodologi yang dapat diakses publik.\n3. Definisi informasi dan hak akses pengguna sesuai ketentuan PPID.\n4. Program kerja dan laporan berkala terkait informasi statistik sektoral dari PPID.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan Penjaminan Transparansi Informasi Statistik di K/L/Pemda (Peraturan SDI, SE, Nota Dinas, Pedoman, Juknis, atau SOP).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 tentang indikator yang dinilaikan (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penjaminan Transparansi Informasi Statistik.",
          },
          {
            code: "40102",
            name: "Penjaminan Netralitas dan Objektivitas terhadap Penggunaan Sumber Data dan Metodologi",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "1. Dokumen yang menunjukkan sumber data dan metodologi dipilih secara objektif merujuk standar nasional/internasional.\n2. Bukti pengakuan pengamat netral/masyarakat (diskusi pra-rilis).\n3. Screenshot waktu rencana rilis data statistik pada web.\n4. Dokumen rilis dan penjelasan data statistik kepada publik dan media secara objektif.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan Penjaminan Netralitas dan Objektivitas terhadap Penggunaan Sumber Data dan Metodologi di K/L/Pemda.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 tentang indikator yang dinilaikan (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penjaminan Netralitas dan Objektivitas.",
          },
          {
            code: "40103",
            name: "Penjaminan Kualitas Data",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "1. Dokumen komitmen penjaminan kualitas data kepada pengguna.\n2. Dokumen proses penjaminan kualitas data.\n3. Dokumen evaluasi periodik terhadap output dan proses statistik.\n4. SK atau Surat Tugas tim penjaminan kualitas data.\n5. Dokumen koordinasi manajemen risiko kualitas data.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan Penjaminan Kualitas Data di K/L/Pemda.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 tentang indikator yang dinilaikan (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penjaminan Kualitas Data.",
          },
          {
            code: "40104",
            name: "Penjaminan Konfidensialitas Data",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "1. Dokumen pelaksanaan manajemen risiko terkait konfidensialitas data (seperti screenshot raw data yang dianonimisasi).\n2. Sertifikat keamanan informasi dari lembaga sertifikasi nasional/internasional (SNI, ISO 27001, dll).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan Penjaminan Konfidensialitas Data di K/L/Pemda beserta screenshot halaman terkait.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 tentang indikator yang dinilaikan (notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penjaminan Konfidensialitas Data.",
          },
        ],
      },
      {
        code: "402",
        name: "SDM yang Memadai dan Kapabel",
        weight: 30,
        indicators: [
          {
            code: "40201",
            name: "Penerapan Kompetensi SDM Bidang Statistik",
            weight: 50,
            totalWeight: 2.55,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Memenuhi salah satu dari 3 jalur bukti dukung:\n- Jalur Jabatan: ABK & Anjab Jabatan Statistisi (ditandatangani resmi);\n- Jalur Pendidikan: Ijazah lulusan statistika;\n- Jalur Penugasan: Surat Tugas melaksanakan kegiatan statistik.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah sesuai jalur:\n- Jalur Jabatan: SK Pejabat Fungsional Statistisi;\n- Jalur Pendidikan/Penugasan: Sertifikat Diklat kompetensi & kapasitas SDM bidang statistik dari Pusdiklat BPS atau Lembaga Statistik Internasional.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Sertifikat Diklat kompetensi SDM bidang statistik tahun 2025/2026 dari Pusdiklat BPS/Lembaga Internasional serta Bukti reviu/evaluasi ke-1 dan ke-2 tentang gap kebutuhan SDM Statistik.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penerapan Kompetensi SDM Bidang Statistik.",
          },
          {
            code: "40202",
            name: "Penerapan Kompetensi SDM Bidang Manajemen Data",
            weight: 50,
            totalWeight: 2.55,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Memenuhi salah satu dari 3 jalur bukti dukung:\n- Jalur Jabatan: ABK & Anjab Jabatan Pranata Komputer;\n- Jalur Pendidikan: Ijazah lulusan manajemen data/TI;\n- Jalur Penugasan: Surat Tugas melaksanakan kegiatan manajemen data.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah sesuai jalur:\n- Jalur Jabatan: SK Pejabat Fungsional Pranata Komputer;\n- Jalur Pendidikan/Penugasan: Sertifikat Diklat kompetensi SDM bidang manajemen data dari Pusdiklat BPS atau Lembaga Internasional.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Sertifikat Diklat kompetensi SDM bidang manajemen data tahun 2025/2026 serta Bukti reviu/evaluasi ke-1 dan ke-2.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Penerapan Kompetensi SDM Bidang Manajemen Data.",
          },
        ],
      },
      {
        code: "403",
        name: "Pengorganisasian Statistik",
        weight: 35,
        indicators: [
          {
            code: "40301",
            name: "Kolaborasi Penyelenggaraan Kegiatan Statistik",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Dokumen kolaborasi informal di lingkup internal instansi/pemda dan antara produsen data dengan walidata dalam penyelenggaraan kegiatan statistik sektoral.",
            level3Criteria:
              "Dokumen kolaborasi formal (risalah/notula, surat undangan, SK/Surat Tugas Tim bukan dari Kepala Instansi) di internal instansi dan antara produsen data dengan walidata.",
            level4Criteria:
              "Dokumen kolaborasi yang dikoordinasikan oleh Kepala Instansi/Kepala Daerah (SK/Surat Tugas Tim dari Kepala Instansi, dokumen formal kolaborasi) ditambah Bukti reviu/evaluasi ke-1 dan ke-2.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Kolaborasi Penyelenggaraan Kegiatan Statistik.",
          },
          {
            code: "40302",
            name: "Penyelenggaraan Forum Satu Data Indonesia",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Dokumen keterlibatan Walidata/Walidata Pendukung dalam Forum Satu Data Indonesia (notula, daftar hadir Forum SDI, dll).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen pelaksanaan Rencana Aksi yang ditetapkan/disepakati dalam Forum Satu Data Indonesia.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen kolaborasi antara Walidata/Walidata Pendukung dengan Walidata Lain atau Pembina Data (laporan/notula rapat).",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Bukti reviu/evaluasi ke-1 dan ke-2 serta Dokumen tindak lanjut reviu/evaluasi.",
          },
          {
            code: "40303",
            name: "Kolaborasi dengan Pembina Data Statistik",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Dokumen kolaborasi pembangunan/pengembangan data dengan Pembina Data secara informal yang diinisiasi oleh Instansi/Pemda.",
            level3Criteria:
              "Dokumen formal kolaborasi pembangunan/pengembangan data dengan Pembina Data yang diinisiasi oleh Instansi/Pemda (surat undangan dari Instansi kepada Pembina Data, notula).",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Bukti pelaksanaan reviu/evaluasi pertama dan ke-2 oleh Instansi yang mengevaluasi kolaborasi dengan Pembina Data.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Kolaborasi dengan Pembina Data Statistik.",
            notes:
              "Kolaborasi harus diinisiasi dari Pemerintah Daerah/OPD; pembinaan yang diinisiasi oleh BPS tidak relevan untuk indikator ini.",
          },
          {
            code: "40304",
            name: "Pelaksanaan Tugas sebagai Walidata",
            weight: 25,
            totalWeight: 1.4875,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak ada atau tidak relevan.",
            level2Criteria:
              "Dokumen kebijakan (misal SK Bupati/Kepala Daerah) terkait penugasan sebagai Walidata Daerah / Walidata Pendukung.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen bukti bahwa walidata telah: (1) mengumpulkan, memeriksa kesesuaian data, dan mengelola data sesuai prinsip SDI; (2) menyebarluaskan data/metadata di Portal SDI; (3) membantu pembina data membina produsen data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen evaluasi Walidata terhadap Produsen Data terkait kelengkapan dan kesesuaian data serta Bukti reviu/evaluasi ke-1 dan ke-2 terhadap tugas sebagai walidata.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pelaksanaan Tugas Walidata.",
          },
        ],
      },
    ],
  },
  {
    code: "5",
    name: "Sistem Statistik Nasional",
    weight: 12,
    description:
      "Pemanfaatan data statistik dasar dan sektoral untuk perencanaan pembangunan, pengelolaan rekomendasi kegiatan statistik (Romantik), serta penguatan SSN berkelanjutan.",
    aspects: [
      {
        code: "501",
        name: "Pemanfaatan Data Statistik",
        weight: 34,
        indicators: [
          {
            code: "50101",
            name: "Penggunaan Data Statistik Dasar untuk Perencanaan, Monitoring, Evaluasi, dan/atau Penyusunan Kebijakan",
            weight: 33,
            totalWeight: 1.3464,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan atau tidak ada.",
            level2Criteria:
              "Dokumen utuh (laporan/publikasi seperti RPJMD, RKPD, Renstra, LPPD beserta screenshot halaman penggunaan data) yang menunjukkan pemanfaatan statistik dasar (data BPS: Sensus, PDRB, inflasi, IPM, kemiskinan, dll) oleh produsen data.",
            level3Criteria:
              "Dokumen pemanfaatan statistik dasar oleh produsen data bersama Walidata untuk kepentingan pemerintah daerah ditambah Dokumen pendukung koordinasi antara Walidata dengan produsen data.",
            level4Criteria:
              "Dokumen pemanfaatan statistik dasar oleh produsen data bersama Walidata dan telah berkoordinasi/berkonsultasi dengan Pembina Data Statistik ditambah Dokumen reviu dan evaluasi secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pemanfaatan Statistik Dasar.",
          },
          {
            code: "50102",
            name: "Penggunaan Data Statistik Sektoral untuk Perencanaan, Monitoring, Evaluasi, dan/atau Penyusunan Kebijakan",
            weight: 33,
            totalWeight: 1.3464,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan atau tidak ada.",
            level2Criteria:
              "Dokumen utuh (laporan/publikasi beserta screenshot halaman penggunaan data) yang menunjukkan pemanfaatan statistik sektoral (data OPD/instansi selain BPS) untuk perencanaan, monev, dan penyusunan kebijakan.",
            level3Criteria:
              "Dokumen pemanfaatan statistik sektoral oleh produsen data bersama Walidata untuk kepentingan pemerintah daerah ditambah Dokumen pendukung koordinasi antara Walidata dengan produsen data.",
            level4Criteria:
              "Dokumen pemanfaatan statistik sektoral oleh produsen data bersama Walidata dan telah berkoordinasi/berkonsultasi dengan Pembina Data Statistik ditambah Dokumen reviu dan evaluasi secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pemanfaatan Statistik Sektoral.",
          },
          {
            code: "50103",
            name: "Sosialisasi dan Literasi Data Statistik",
            weight: 34,
            totalWeight: 1.3872,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan atau tidak ada.",
            level2Criteria:
              "Dokumen pelaksanaan Sosialisasi Data Statistik oleh produsen data (leaflet, kegiatan expo, infografis, webinar, dsb).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen kebijakan (peraturan, pedoman, SOP, dsj) untuk pelaksanaan sosialisasi bagi seluruh produsen data.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi secara berkala untuk pelaksanaan Sosialisasi Data Statistik.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Sosialisasi Data Statistik.",
          },
        ],
      },
      {
        code: "502",
        name: "Pengelolaan Kegiatan Statistik",
        weight: 33,
        indicators: [
          {
            code: "50201",
            name: "Pelaksanaan Rekomendasi Kegiatan Statistik",
            weight: 100,
            totalWeight: 3.96,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan, tidak lengkap untuk 2 kegiatan statistik sektoral, atau tidak ada.",
            level2Criteria:
              "Bukti pemberitahuan rancangan kegiatan statistik ke BPS (melalui Aplikasi Romantik / romantik.web.bps.go.id) berkaitan dengan dua kegiatan yang dievaluasi dan telah dikoordinasikan dengan Walidata.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Surat Rekomendasi BPS dari dua kegiatan yang dinilaikan, dan/atau Dokumen kebijakan (Perbup/SOP) yang mengatur pemberitahuan rancangan kegiatan statistik ke BPS.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi secara berkala terkait pelaksanaan rekomendasi kegiatan statistik.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan Pelaksanaan Rekomendasi Kegiatan Statistik.",
          },
        ],
      },
      {
        code: "503",
        name: "Penguatan SSN Berkelanjutan",
        weight: 33,
        indicators: [
          {
            code: "50301",
            name: "Perencanaan Pembangunan Statistik",
            weight: 34,
            totalWeight: 1.3464,
            level1Criteria:
              "Dokumen Perencanaan Pembangunan Statistik belum disusun, tidak relevan, atau tidak ada.",
            level2Criteria:
              "Dokumen Perencanaan Pembangunan Statistik telah disusun dan ditetapkan (Rencana Aksi SDI Daerah yang mencantumkan tahun, aktivitas pembangunan statistik, legalisasi, dan mengikat seluruh produsen data).",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen Pelaksanaan Perencanaan Pembangunan Statistik.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu serta evaluasi perencanaan pembangunan statistik secara berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan perencanaan pembangunan statistik.",
          },
          {
            code: "50302",
            name: "Penyebarluasan Data",
            weight: 33,
            totalWeight: 1.3068,
            level1Criteria:
              "Belum ada penyebarluasan data, bukti tidak relevan, atau tidak ada.",
            level2Criteria:
              "Bukti dukung menunjukkan bahwa Penyebarluasan data dilakukan oleh produsen data.",
            level3Criteria:
              "Bukti dukung menunjukkan bahwa Penyebarluasan data telah dilakukan oleh Walidata untuk kepentingan pemerintah daerah.",
            level4Criteria:
              "Bukti dukung menunjukkan bahwa Penyebarluasan data dilakukan oleh Walidata melalui pusat rujukan informasi statistik, Portal Satu Data Kabupaten Berau, JIGN, dan/atau Dokumen reviu dan evaluasi berkala.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen penjelasan berisi screenshot/berkas sebelum dan setelah perbaikan/penyempurnaan/pemutakhiran penyebarluasan data.",
          },
          {
            code: "50303",
            name: "Pemanfaatan Big Data",
            weight: 33,
            totalWeight: 1.3068,
            level1Criteria:
              "Bukti administrasi/pelaksanaan tidak relevan atau tidak ada.",
            level2Criteria:
              "Dokumen pemanfaatan Big Data oleh produsen data baik dalam bentuk kajian maupun eksperimen.",
            level3Criteria:
              "Terpenuhinya bukti dukung Level 2 ditambah Dokumen pemanfaatan Big Data oleh produsen data bersama Walidata untuk menghasilkan data statistik pendukung dan siap dibagipakaikan.",
            level4Criteria:
              "Terpenuhinya bukti dukung Level 3 ditambah Dokumen reviu dan evaluasi secara berkala terkait pemanfaatan Big Data bersama Pembina Data Statistik.",
            level5Criteria:
              "Terpenuhinya bukti dukung Level 4 ditambah Dokumen pelaksanaan reviu dan evaluasi yang menunjukkan before-after tindak lanjut terkait pemanfaatan Big Data.",
          },
        ],
      },
    ],
  },
];

export const MATURITY_LEVEL_LABELS: Record<
  number,
  { name: string; badgeClass: string; shortDesc: string }
> = {
  1: {
    name: "Level 1 — Rintisan",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    shortDesc: "Proses statistik belum terstandar atau dilakukan secara ad-hoc.",
  },
  2: {
    name: "Level 2 — Terkelola",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    shortDesc: "Proses statistik telah dilakukan sesuai standar pada unit kerja.",
  },
  3: {
    name: "Level 3 — Terdefinisi",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    shortDesc: "Proses statistik telah distandarisasi dengan regulasi/SOP se-instansi.",
  },
  4: {
    name: "Level 4 — Terpadu & Terukur",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
    shortDesc: "Proses statistik telah direviu dan dievaluasi secara berkala & terukur.",
  },
  5: {
    name: "Level 5 — Optimum",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    shortDesc: "Perbaikan dan inovasi berkelanjutan berdasarkan hasil reviu dan evaluasi.",
  },
};

