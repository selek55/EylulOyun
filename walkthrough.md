# 3D Matematik Oyunu - Prototip Tamamlandı

## Yapılanlar
Belirtilen gereksinimler doğrultusunda oyunun tüm altyapısı ve mekanikleri başarıyla geliştirildi:

1. **3D Ortam (Three.js):**
   - Uzayan bir yol, çim zemin ve yolda ilerledikçe iki kenarda beliren ağaçlar oluşturuldu.
   - Kamera açısı oyuncunun aracının hemen arkasına, uygun bir sürüş hissiyatı verecek şekilde konumlandırıldı.
2. **Matematik Soru Üreticisi (5. Sınıf Seviyesi):**
   - **Seviye 1 (Baştan):** 2 Şerit aktif. Temel toplama ve çıkarma işlemleri.
   - **Seviye 2 (5 Skor sonrası):** 4 Şerit aktif. Çarpanlardan birinin tek haneli olduğu çarpma ve daha büyük sayılarla toplama/çıkarma işlemleri.
   - **Seviye 3 (12 Skor sonrası):** Kamyonlar ve tırlar devreye girer. Bölme işlemleri ve ileri seviye çarpmalar.
3. **Araçlar ve Özelleştirme:**
   - Oyun başında **Oyuncu Adınızı**, **Araba Renginizi** ve **Araba Tipinizi** (Standart, Spor Araba, Kamyon) istediğiniz gibi seçebilirsiniz. Oyuna yansıyan aracınız basit bir kutu değil; seçtiğiniz tipe uygun, gövdesi, camlı kabini ve tekerlekleri olan 3D bir araba modelidir (Örneğin Spor arabanın tekerlekleri daha geniş ve arkasında rüzgarlığı bulunur).
   - Bu ekranda seçtiğiniz isme göre yapılan skorlar tarayıcı belleğine (localStorage) kaydedilerek **"En Yüksek Skor"** olarak ana menüde gösterilir.
   - Doğrudan **Zorluk Seviyesi** seçerek (Seviye 1, 2 veya 3) oyuna başlayabilirsiniz. Böylelikle deneyimli oyuncular çok yavaş kısımları atlayabilir.
   - Seçtiğiniz araba ile sağ/sol **Yön Tuşları** veya **A/D** tuşları ile birbirinden ayrılmış **Geniş Şeritler** arasında yumuşak geçiş yaparsınız. 3 basamaklı büyük cevaplar artık birbirine ve diğer şeritlere girmez.
   - Doğru cevaplar ve çeldirici cevaplar artık sadece araçların (kabinli arabalar ve 6 tekerlekli uzun kamyonların) üstünde **havada süzülen çok daha net ve büyük yazılar (Sprite)** olarak çıkar. Bu sayede uzaktan okumak çok daha kolaydır.
4. **Can ve Bonus Sistemi:**
   - Oyun 5 can (❤️) ile başlar. Yanlış cevaba çarpıldığında 1 can eksilir, ekran kırmızı yanıp söner.
   - Rastgele aralıklarla şeritlerde beyaz, **bulut şeklinde can bonusları** çıkar. Çarpıldığında canınızı 5'i geçmeyecek şekilde +1 arttırır ve skor yeşil yanar.
5. **Kullanıcı Arayüzü (UI):**
   - Çocuklar için okunaklı büyük fontlar (`Nunito`) kullanıldı.
   - Başlangıç ekranı, Oyun İçi Bilgi Ekranı (soru, can, skor), Oyun Bitti ekranı ve Kazanma ekranı eklendi.

## Nasıl Test Edilir?
Oyun tamamen tarayıcı tabanlıdır ve herhangi bir kuruluma ihtiyaç duymaz.
Test etmek için takım klasörünüzdeki [index.html](file:///d:/repos/selek55/EylulOyun/index.html) dosyasına çift tıklayarak modern bir tarayıcıda (Chrome, Edge vb.) açmanız yeterlidir:

[d:\repos\selek55\EylulOyun\index.html](file:///d:/repos/selek55/EylulOyun/index.html)

- Açıldıktan sonra "Oyuna Başla" butonuna tıklayın.
- Yon tuşlarını kullanarak doğru cevap veren arabanın bulunduğu şeride geçin!
- Bulutları toplayıp canınızı arttırın. 20 soruya doğru cevap verip oyunu kazanın.

İyi oyunlar!
