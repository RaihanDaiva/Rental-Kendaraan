import cv2
import numpy as np

def verify_money_authenticity(image_path, bbox=None):
    """
    Fungsi untuk mendeteksi keaslian uang menggunakan pengolahan citra (OpenCV),
    mengadaptasi konsep 3D (Dilihat, Diraba, Diterawang) secara algoritmik.
    """
    # Baca gambar
    img = cv2.imread(image_path)
    if img is None:
        return True, "Gagal membaca gambar"

    # Crop gambar sesuai Bounding Box jika ada
    if bbox:
        x, y, w, h = bbox
        xmin, ymin = int(max(0, x - w / 2)), int(max(0, y - h / 2))
        xmax, ymax = int(min(img.shape[1], x + w / 2)), int(min(img.shape[0], y + h / 2))
        img_crop = img[ymin:ymax, xmin:xmax]
        if img_crop.size == 0:
            img_crop = img
    else:
        img_crop = img

    # --- 1. DILIHAT: Analisis Warna dan Saturasi (Mendeteksi Fotokopi Hitam Putih / Pudar) ---
    hsv = cv2.cvtColor(img_crop, cv2.COLOR_BGR2HSV)
    mean_saturation = np.mean(hsv[:, :, 1])
    
    # Toleransi diturunkan ke 5 (sangat ekstrem baru dianggap fotokopi hitam putih)
    if mean_saturation < 5:
        return False, f"DILIHAT: Terindikasi Palsu (Hitam-putih murni, Saturasi: {mean_saturation:.2f})"

    # --- 2. DIRABA: Analisis Tekstur Kasar/Intaglio (Ketajaman dan Kerapatan Garis) ---
    gray = cv2.cvtColor(img_crop, cv2.COLOR_BGR2GRAY)
    
    # Toleransi diturunkan drastis ke 10. Jika kamera HP sedikit goyang (blur), uang asli tidak langsung dianggap palsu.
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 10:
        return False, f"DIRABA: Terindikasi Palsu (Sangat buram/licin, Ketajaman: {laplacian_var:.2f})"

    # Toleransi diturunkan ke 0.005. 
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
    if edge_density < 0.005:
        return False, f"DIRABA: Terindikasi Palsu (Detail garis hilang sama sekali, Kerapatan: {edge_density:.4f})"

    # --- 3. DITERAWANG: Analisis Kontras dan Distribusi Cahaya (Rentang Dinamis) ---
    # Toleransi diturunkan ke 15. Untuk mengatasi masalah foto di ruangan yang gelap.
    std_brightness = np.std(hsv[:, :, 2])
    if std_brightness < 15:
        return False, f"DITERAWANG: Terindikasi Palsu (Kontras gambar mati, Std Dev: {std_brightness:.2f})"

    # Jika lolos semua pengecekan
    return True, "Lolos Pengecekan 3D Citra"
