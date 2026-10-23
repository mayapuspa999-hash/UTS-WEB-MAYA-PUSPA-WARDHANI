/* mode gelap */
const KUNCI_TEMA = "tema-portofolio-maya";
const tombolTema = document.getElementById("tombolTema");
const ikonTema = document.getElementById("ikonTema");
const labelTema = document.getElementById("labelTema");

// membaca tema yang tersimpan (dibungkus try/catch karena storage bisa diblokir)
function ambilTemaTersimpan() {
  try {
    return localStorage.getItem(KUNCI_TEMA);
  } catch (error) {
    return null;
  }
}

function simpanTema(tema) {
  try {
    localStorage.setItem(KUNCI_TEMA, tema);
  } catch (error) {}
}

// menerapkan tema ke halaman //
function terapkanTema(tema) {
  const gelap = tema === "dark";
  document.documentElement.setAttribute("data-bs-theme", tema);
  tombolTema.setAttribute("aria-pressed", String(gelap));
  tombolTema.setAttribute(
    "aria-label",
    gelap ? "Aktifkan mode terang" : "Aktifkan mode gelap",
  );
  ikonTema.className = gelap ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  labelTema.textContent = gelap ? "Mode Terang" : "Mode Gelap";
}

function ubahTema() {
  const temaSekarang = document.documentElement.getAttribute("data-bs-theme");
  const temaBaru = temaSekarang === "dark" ? "light" : "dark";
  terapkanTema(temaBaru);
  simpanTema(temaBaru);
}

tombolTema.addEventListener("click", ubahTema);
terapkanTema(ambilTemaTersimpan() === "dark" ? "dark" : "light");

/* navbar */
const navbar = document.getElementById("mainNav");
const menuNavbar = document.getElementById("navbarNav");
const tombolAtas = document.getElementById("toTop");

// animasi AOS
if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 900,
    once: true,
    disable: function () {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
  });
} else {
  document.querySelectorAll("[data-aos]").forEach(function (el) {
    el.removeAttribute("data-aos");
  });
}

// menutup menu mobile otomatis setelah link diklik
document.querySelectorAll("#navbarNav .nav-link").forEach(function (link) {
  link.addEventListener("click", function () {
    if (menuNavbar.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menuNavbar).hide();
    }
  });
});

// navbar mengecil dan tombol ke atas muncul saat halaman di-scroll
function aturTampilanScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
  tombolAtas.classList.toggle("show", window.scrollY > 400);
}
window.addEventListener("scroll", aturTampilanScroll);
aturTampilanScroll();

tombolAtas.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// tahun otomatis di footer
document.getElementById("tahun").textContent = new Date().getFullYear();

/*  KALKULATOR ESTIMASI BIAYA PROYEK */
const BATAS_DISKON = 500000;
const PERSEN_DISKON = 0.1;

const formKalkulator = document.getElementById("formKalkulator");
const pilihJenis = document.getElementById("calcJenis");
const inputHalaman = document.getElementById("calcHalaman");
const errorHalaman = document.getElementById("errorHalaman");
const daftarFitur = document.querySelectorAll(".fitur-tambahan");
const tombolResetKalkulator = document.getElementById("tombolResetKalkulator");
const pesanHasil = document.getElementById("pesanHasil");
const rincianHasil = document.getElementById("rincianHasil");
const barisTotal = document.getElementById("barisTotal");
const hasilTotal = document.getElementById("hasilTotal");
const statEstimasi = document.getElementById("statEstimasi");

// mengubah angka menjadi format rupiah
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// memeriksa input jumlah halaman, mengembalikan pesan error ("" jika valid)
function cekJumlahHalaman() {
  const teks = inputHalaman.value.trim();
  const angka = Number(teks);

  if (teks === "") {
    return "Jumlah halaman wajib diisi.";
  }
  if (!Number.isInteger(angka)) {
    return "Jumlah halaman harus berupa bilangan bulat.";
  }
  if (angka < 1 || angka > 20) {
    return "Jumlah halaman harus antara 1 sampai 20.";
  }
  return "";
}

// menghitung semua komponen biaya, mengembalikan object hasil
function hitungEstimasi() {
  const opsiDipilih = pilihJenis.options[pilihJenis.selectedIndex];
  const hargaPerHalaman = Number(opsiDipilih.dataset.harga);
  const namaJenis = opsiDipilih.textContent.split(" (")[0];
  const halaman = Number(inputHalaman.value);

  const biayaHalaman = hargaPerHalaman * halaman;

  let biayaFitur = 0;
  const fiturDipilih = [];
  daftarFitur.forEach(function (kotak) {
    if (kotak.checked) {
      const harga = Number(kotak.value);
      biayaFitur += harga;
      fiturDipilih.push({ nama: kotak.dataset.nama, harga: harga });
    }
  });

  const subtotal = biayaHalaman + biayaFitur;
  let diskon = 0;
  if (subtotal > BATAS_DISKON) {
    diskon = subtotal * PERSEN_DISKON;
  }
  const total = subtotal - diskon;

  // perkiraan waktu: 1,5 hari per halaman + 2 hari per fitur tambahan
  const hari = Math.ceil(halaman * 1.5) + fiturDipilih.length * 2;

  return {
    namaJenis: namaJenis,
    hargaPerHalaman: hargaPerHalaman,
    halaman: halaman,
    biayaHalaman: biayaHalaman,
    fiturDipilih: fiturDipilih,
    subtotal: subtotal,
    diskon: diskon,
    total: total,
    hari: hari,
  };
}

// membuat satu baris rincian <div><dt>..</dt><dd>..</dd></div>
function buatBaris(label, nilai, kelasTambahan) {
  const baris = document.createElement("div");
  baris.className = "baris" + (kelasTambahan ? " " + kelasTambahan : "");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = nilai;
  baris.appendChild(dt);
  baris.appendChild(dd);
  return baris;
}

// menampilkan hasil perhitungan ke DOM
function tampilkanHasil(hasil) {
  rincianHasil.innerHTML = "";

  rincianHasil.appendChild(
    buatBaris(
      hasil.namaJenis + " x " + hasil.halaman + " halaman",
      formatRupiah(hasil.biayaHalaman),
    ),
  );
  hasil.fiturDipilih.forEach(function (fitur) {
    rincianHasil.appendChild(buatBaris(fitur.nama, formatRupiah(fitur.harga)));
  });
  rincianHasil.appendChild(buatBaris("Subtotal", formatRupiah(hasil.subtotal)));

  if (hasil.diskon > 0) {
    rincianHasil.appendChild(
      buatBaris("Diskon 10%", "- " + formatRupiah(hasil.diskon), "diskon"),
    );
  }
  rincianHasil.appendChild(
    buatBaris("Perkiraan pengerjaan", hasil.hari + " hari"),
  );

  hasilTotal.textContent = formatRupiah(hasil.total);
  statEstimasi.textContent = formatRupiah(hasil.total);

  pesanHasil.classList.add("d-none");
  rincianHasil.classList.remove("d-none");
  barisTotal.classList.remove("d-none");
}

// dipanggil setiap input berubah: validasi dulu, baru hitung
function perbaruiKalkulator() {
  const pesanError = cekJumlahHalaman();

  if (pesanError !== "") {
    inputHalaman.classList.add("is-invalid");
    errorHalaman.textContent = pesanError;
    rincianHasil.classList.add("d-none");
    barisTotal.classList.add("d-none");
    pesanHasil.classList.remove("d-none");
    pesanHasil.textContent =
      "Perbaiki isian jumlah halaman untuk melihat hasil.";
    return;
  }

  inputHalaman.classList.remove("is-invalid");
  errorHalaman.textContent = "";
  tampilkanHasil(hitungEstimasi());
}

formKalkulator.addEventListener("submit", function (event) {
  event.preventDefault();
  perbaruiKalkulator();
});
formKalkulator.addEventListener("input", perbaruiKalkulator);
formKalkulator.addEventListener("change", perbaruiKalkulator);

tombolResetKalkulator.addEventListener("click", function () {
  formKalkulator.reset(); // kembali ke nilai awal di HTML
  perbaruiKalkulator();
});

// tampilkan hasil awal dengan nilai default
perbaruiKalkulator();

/* FILTER & PENCARIAN PROYEK */
const kartuProyek = document.querySelectorAll(".proyek-item");
const tombolFilter = document.querySelectorAll(".btn-filter");
const inputCari = document.getElementById("cariProyek");
const infoJumlah = document.getElementById("infoJumlah");
const pesanKosong = document.getElementById("pesanKosong");
const tombolResetFilter = document.getElementById("tombolResetFilter");
const statTotal = document.getElementById("statTotal");
const statTampil = document.getElementById("statTampil");

let kategoriAktif = "semua";

// apakah kartu cocok dengan kategori yang sedang dipilih?
function cocokDenganKategori(kartu) {
  if (kategoriAktif === "semua") {
    return true;
  }
  return kartu.dataset.kategori.split(" ").includes(kategoriAktif);
}

// apakah teks kartu mengandung kata kunci pencarian?
function cocokDenganKataKunci(kartu, kataKunci) {
  const isiKartu = kartu.textContent.replace(/\s+/g, " ").toLowerCase();
  return isiKartu.includes(kataKunci);
}

function terapkanFilter() {
  const kataKunci = inputCari.value.trim().replace(/\s+/g, " ").toLowerCase();
  let jumlahTampil = 0;

  kartuProyek.forEach(function (kartu) {
    const tampil =
      cocokDenganKategori(kartu) && cocokDenganKataKunci(kartu, kataKunci);
    const sebelumnyaTersembunyi = kartu.classList.contains("d-none");

    kartu.classList.toggle("d-none", !tampil);

    // animasi kecil saat kartu muncul kembali
    if (tampil && sebelumnyaTersembunyi) {
      kartu.classList.remove("muncul");
      void kartu.offsetWidth; // memaksa animasi diulang
      kartu.classList.add("muncul");
    }
    if (tampil) {
      jumlahTampil++;
    }
  });

  infoJumlah.textContent =
    "Menampilkan " + jumlahTampil + " dari " + kartuProyek.length + " proyek";
  statTampil.textContent = jumlahTampil;
  pesanKosong.classList.toggle("d-none", jumlahTampil > 0);
}

tombolFilter.forEach(function (tombol) {
  tombol.addEventListener("click", function () {
    kategoriAktif = tombol.dataset.filter;
    tombolFilter.forEach(function (t) {
      const aktif = t === tombol;
      t.classList.toggle("active", aktif);
      t.setAttribute("aria-pressed", String(aktif));
    });
    terapkanFilter();
  });
});

inputCari.addEventListener("input", terapkanFilter);

tombolResetFilter.addEventListener("click", function () {
  inputCari.value = "";
  tombolFilter[0].click(); // kembali ke kategori "Semua"
  inputCari.focus();
});

statTotal.textContent = kartuProyek.length;
terapkanFilter();

/* VALIDASI FORM KONTAK */
const EMAIL_TUJUAN = "mayapuspa999@gmail.com";
const POLA_NAMA = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/;
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAKS_PESAN = 500;

const formKontak = document.getElementById("formKontak");
const inputNama = document.getElementById("nama");
const inputEmail = document.getElementById("email");
const inputPesan = document.getElementById("pesan");
const errorNama = document.getElementById("errorNama");
const errorEmail = document.getElementById("errorEmail");
const errorPesan = document.getElementById("errorPesan");
const hitungPesan = document.getElementById("hitungPesan");
const hasilForm = document.getElementById("hasilForm");

// setiap fungsi cek mengembalikan pesan error ("" jika isian valid)
function cekNama() {
  const nilai = inputNama.value.trim();
  if (nilai === "") {
    return "Nama wajib diisi.";
  }
  if (nilai.length < 3) {
    return "Nama minimal 3 karakter.";
  }
  if (!POLA_NAMA.test(nilai)) {
    return "Nama hanya boleh berisi huruf dan spasi.";
  }
  return "";
}

function cekEmail() {
  const nilai = inputEmail.value.trim();
  if (nilai === "") {
    return "Email wajib diisi.";
  }
  if (!POLA_EMAIL.test(nilai)) {
    return "Format email belum benar, contoh: nama@email.com";
  }
  return "";
}

function cekPesan() {
  const nilai = inputPesan.value.trim();
  if (nilai === "") {
    return "Pesan wajib diisi.";
  }
  if (nilai.length < 10) {
    return "Pesan minimal 10 karakter.";
  }
  if (nilai.length > MAKS_PESAN) {
    return "Pesan maksimal " + MAKS_PESAN + " karakter.";
  }
  return "";
}

// menandai kolom valid / tidak valid, mengembalikan true jika valid
function tampilkanStatus(input, elemenError, pesanError) {
  const valid = pesanError === "";
  input.classList.toggle("is-invalid", !valid);
  input.classList.toggle("is-valid", valid);
  input.setAttribute("aria-invalid", String(!valid));
  elemenError.textContent = pesanError;
  return valid;
}

// daftar kolom agar mudah diproses dengan perulangan
const daftarKolom = [
  { input: inputNama, error: errorNama, cek: cekNama },
  { input: inputEmail, error: errorEmail, cek: cekEmail },
  { input: inputPesan, error: errorPesan, cek: cekPesan },
];

daftarKolom.forEach(function (kolom) {
  // cek saat pengguna selesai mengisi kolom
  kolom.input.addEventListener("blur", function () {
    tampilkanStatus(kolom.input, kolom.error, kolom.cek());
  });
  // setelah kolom pernah dicek, perbarui status saat mengetik
  kolom.input.addEventListener("input", function () {
    const sudahDicek =
      kolom.input.classList.contains("is-invalid") ||
      kolom.input.classList.contains("is-valid");
    if (sudahDicek) {
      tampilkanStatus(kolom.input, kolom.error, kolom.cek());
    }
  });
});

// penghitung karakter pesan
inputPesan.addEventListener("input", function () {
  hitungPesan.textContent = inputPesan.value.length + "/" + MAKS_PESAN;
});

// membuat kotak alert Bootstrap di bawah form
function tampilkanAlert(jenis, teks, tautan) {
  hasilForm.innerHTML = "";
  const alert = document.createElement("div");
  alert.className = "alert alert-" + jenis + " mb-0";
  alert.setAttribute("role", "alert");
  alert.appendChild(document.createTextNode(teks));
  if (tautan) {
    alert.appendChild(document.createTextNode(" "));
    alert.appendChild(tautan);
  }
  hasilForm.appendChild(alert);
}

// membuat tautan mailto berisi data form yang sudah valid
function buatTautanEmail(nama, email, pesan) {
  const subjek = "Pesan dari " + nama + " (portofolio)";
  const isi = pesan + "\n\nNama: " + nama + "\nEmail: " + email;
  const a = document.createElement("a");
  a.className = "alert-link";
  a.href =
    "mailto:" +
    EMAIL_TUJUAN +
    "?subject=" +
    encodeURIComponent(subjek) +
    "&body=" +
    encodeURIComponent(isi);
  a.textContent = "Buka aplikasi email untuk mengirim";
  return a;
}

function kosongkanForm() {
  formKontak.reset();
  daftarKolom.forEach(function (kolom) {
    kolom.input.classList.remove("is-valid", "is-invalid");
    kolom.input.removeAttribute("aria-invalid");
    kolom.error.textContent = "";
  });
  hitungPesan.textContent = "0/" + MAKS_PESAN;
}

formKontak.addEventListener("submit", function (event) {
  event.preventDefault(); // cegah form terkirim sebelum divalidasi

  // semua kolom dicek (tanpa berhenti di kolom pertama yang salah)
  let semuaValid = true;
  let kolomSalahPertama = null;
  daftarKolom.forEach(function (kolom) {
    const valid = tampilkanStatus(kolom.input, kolom.error, kolom.cek());
    if (!valid) {
      semuaValid = false;
      if (kolomSalahPertama === null) {
        kolomSalahPertama = kolom.input;
      }
    }
  });

  if (!semuaValid) {
    tampilkanAlert(
      "danger",
      "Mohon periksa kembali isian yang ditandai merah.",
    );
    kolomSalahPertama.focus();
    return;
  }

  const nama = inputNama.value.trim();
  const tautan = buatTautanEmail(
    nama,
    inputEmail.value.trim(),
    inputPesan.value.trim(),
  );
  tampilkanAlert(
    "success",
    "Terima kasih, " + nama + "! Isianmu sudah valid.",
    tautan,
  );
  kosongkanForm();
});
