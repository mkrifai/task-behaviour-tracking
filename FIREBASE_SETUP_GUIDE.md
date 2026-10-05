# Panduan Pengaturan Firebase & Sinkronisasi Cloud

Aplikasi **HabitPulse** dirancang dengan prinsip **Offline-First**, artinya aplikasi dapat langsung digunakan sepenuhnya di peramban (browser) laptop maupun HP tanpa perlu koneksi Firebase terlebih dahulu. Data tersimpan secara aman di penyimpanan lokal.

Jika kamu ingin data tersinkronisasi otomatis antara HP dan laptop, ikuti langkah mudah di bawah ini (hanya butuh waktu sekitar 5–10 menit):

---

## Langkah 1: Buat Proyek Firebase (Gratis)
1. Buka [Firebase Console](https://console.firebase.google.com/) dan login menggunakan akun Google kamu.
2. Klik tombol **"Add project"** (Tambah proyek).
3. Beri nama proyek, misalnya: `HabitPulse-Tracking`.
4. Nonaktifkan Google Analytics (opsional), lalu klik **"Create project"**.

---

## Langkah 2: Aktifkan Firebase Authentication (Login Google)
1. Di bilah menu kiri Firebase Console, klik **Build** > **Authentication**.
2. Klik **Get Started**.
3. Di tab **Sign-in method**, pilih **Google**.
4. Aktifkan toggle **Enable**, isi *Project support email* dengan email Google kamu, lalu klik **Save**.

---

## Langkah 3: Aktifkan Firestore Database
1. Di bilah menu kiri, klik **Build** > **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi database terdekat (misalnya: `asia-southeast2` untuk Jakarta).
4. Pilih mode keamanan **Start in production mode**, lalu klik **Create**.
5. Buka tab **Rules**, lalu masukkan aturan keamanan berikut agar hanya akunmu yang bisa mengakses datamu:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
6. Klik **Publish**.

---

## Langkah 4: Daftarkan Web App & Ambil Konfigurasi
1. Di halaman Project Overview (ikon gerigi di kiri atas > **Project settings**).
2. Di bagian *Your apps*, klik ikon Web (`</>`).
3. Beri nama aplikasi (misal: `HabitPulse Web`), centang opsi **"Also set up Firebase Hosting"** jika ingin link online gratis, lalu klik **Register app**.
4. Salin objek `firebaseConfig` yang muncul, contohnya:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "habitpulse.firebaseapp.com",
  projectId: "habitpulse",
  storageBucket: "habitpulse.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```
5. Buat file `.env` di folder utama proyek dan masukkan nilainya:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=habitpulse.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=habitpulse
VITE_FIREBASE_STORAGE_BUCKET=habitpulse.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=AIzaSy... (Opsional untuk AI)
```

---

## Langkah 5: Pasang (Install) di HP sebagai PWA
1. Buka URL aplikasi di peramban HP (misal Chrome di Android atau Safari di iOS).
2. Di Chrome Android: ketuk menu titik tiga (⋮) > **"Tambahkan ke Layar Utama"** / **"Install App"**.
3. Di Safari iOS: ketuk tombol Share > **"Add to Home Screen"**.
4. Aplikasi akan terpasang dengan ikon dan bekerja seperti aplikasi native tanpa bilah URL browser!
