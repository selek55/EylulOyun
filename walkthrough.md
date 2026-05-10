# Matematik Yolculuğu — Geliştirme Notu

**Yayın URL:** [https://selek55.github.io/EylulOyun/](https://selek55.github.io/EylulOyun/)
**Hedef:** 10 yaş, 5. sınıf öğrencileri için 3D matematik oyunu
**Stack:** Three.js r128, Vanilla JS, HTML5/CSS3, Web Audio API

---

## Nasıl Oynanır?

- Oyuncu arabası ← → / A D tuşları veya mobil dokunmatik butonlarla hareket eder
- Ekranda bir matematik sorusu belirir; doğru cevabı taşıyan araca çarpılır
- 20 doğru cevap → **kazanma**; 5 can → **oyun bitti**
- Yanlış araca veya kırmızı ✖ engel araca çarpmak can kaybettirir
- 3 üst üste doğru → **seri bonusu** (+1 puan ekstra, 🔥 göstergesi)
- Beyaz bulutlara çarpmak can kazandırır (maks. 5)

---

## Özellikler

| Özellik | Detay |
| --- | --- |
| Hız Ayarı | Yavaş / Normal / Hızlı — oyun boyunca **sabit** kalır |
| Konu Seçimi | Karışık / Toplama / Çıkarma / Çarpma / Bölme |
| Araba Özelleştirme | Renk (color picker), Tip (Standart/Spor/Kamyon), İsim |
| Seviye | 1 (2 şerit) / 2 (4 şerit) / 3 (Zor) |
| Gece Modu | Three.js ışık yoğunluğu + CSS sınıfı + görünür far konileri |
| Ses Efektleri | Web Audio API ile procedural (doğru/yanlış/can/kazanma) |
| Liderlik Tablosu | LocalStorage, ilk 5 skor |
| Hak Bulutu | Can < 5 iken aktif dalgada z=-70'te spawn |
| Engel Araçlar | Score ≥ 3'ten sonra %45 ihtimalle, z=-60 ile -100 arası |
| Konfeti | Kazanma ekranında CSS animasyonu |
| Paylaş | Sonucu panoya kopyalar |
| Mobil | Dokunmatik ← → butonlar, responsive CSS |

---

## Önemli Teknik Kararlar

### Spawn Mesafeleri

```text
Yeni cevap batch'ı  →  z = -150
Hak bulutu          →  z = -70   (aralarında 80 birim boşluk)
Engel araçlar       →  z = -60 ile -100 (handleCollision içinde)
Oyuncu              →  z = 0
Despawn noktası     →  z = +8
```

Bulutun ve engellerin cevap araçlarının üzerine binmemesi için bu ayrım korunmalı.

### Hız

```js
SPEED_PRESETS = [0.045, 0.075, 0.115]  // Yavaş / Normal / Hızlı
```

`gameState.speedBase` başlangıçta set edilir, oyun içinde **güncellenmez**.

### Gece Modu Far

SpotLight (intensity=12) + CylinderGeometry koni (BackSide, opacity=0.2) birlikte kullanılır.
Sadece SpotLight ile ışığın arabadan çıktığı görsel olarak belli olmaz.

### Ses

```js
playSound('correct' | 'wrong' | 'life' | 'win' | 'gameover')
```

Harici dosya yok; Web Audio API ile tamamen procedural üretilir.

---

## Dosya Yapısı

```text
EylulOyun/
├── index.html     — UI overlay'leri, HUD, özelleştirme formu
├── style.css      — Night mode, streak animasyonu, confetti, responsive
├── main.js        — Tüm oyun mantığı (Three.js scene, spawn, collision, audio)
└── walkthrough.md — Bu dosya
```

---

## Geliştirme Geçmişi

1. Temel 3D oyun yapısı (Three.js sahne, araçlar, sorular)
2. GitHub Pages'e yayınlama → [selek55.github.io/EylulOyun](https://selek55.github.io/EylulOyun/)
3. Mobil uyumluluk + dokunmatik kontroller
4. 3 seviyeli sabit hız ayarı (Yavaş/Normal/Hızlı)
5. Konu seçimi (varsayılan: karışık)
6. Engel araçlar, seri bonusu, oyun sonu istatistikleri
7. Ses efektleri (Web Audio API, procedural)
8. Gece modu + görünür far konileri (SpotLight + CylinderGeometry)
9. Konfeti, paylaş butonu, liderlik tablosu
10. Spawn mesafesi düzeltmeleri (bulut / engel ↔ cevap çakışması giderildi)

---

## Test

Oyun tarayıcı tabanlıdır, kurulum gerekmez.
Lokal test: `index.html` dosyasını Chrome/Edge ile aç.
Online: [selek55.github.io/EylulOyun](https://selek55.github.io/EylulOyun/)

İyi oyunlar! 🎮
