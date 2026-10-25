# Toscana Ristorante — Yerel Ağ Sipariş Sistemi

Garson telefonları, kasa ve mutfak ekranı aynı Wi-Fi üzerinden kasa bilgisayarına bağlanır.
İnternet, bulut ve aylık ücret gerekmez.

- **Garson** (`/garson`): masa seç, ürün ekle, not yaz, mutfağa gönder.
- **Kasa** (`/kasa`): masa planı, adisyon, parçalı ödeme, iptal, masa taşıma, gün sonu.
- **Mutfak** (`/mutfak`): siparişler sayfa yenilenmeden kart olarak düşer, "Tamamla" ile kalkar.

## 1. Kasa bilgisayarına bir kez kurulacaklar

1. **Node.js** (LTS sürümü): <https://nodejs.org> adresindeki "LTS" butonuyla indirip kurun.
2. **PostgreSQL** (Windows): <https://www.postgresql.org/download/windows/> adresinden kurun.
   Kurulumda istenen `postgres` kullanıcısının şifresini not edin. Stack Builder gerekmez.

Kontrol için VS Code terminalinde:

```
node -v
npm -v
```

## 2. Projeyi kurma

VS Code'da `toscana` klasörünü açın, **Terminal → Yeni Terminal** ve sırayla:

```
npm install
npm run setup
```

`npm run setup` PostgreSQL şifresini sorar, `server/.env` dosyasını oluşturur, veritabanını açar,
tabloları kurar ve menüyü (19 ürün, 20 masa, test personeli) yükler.

## 3. Çalıştırma (geliştirme modu)

```
npm run dev
```

- Kasa bilgisayarında: <http://localhost:5173>
- Telefonlarda: `http://KASA-IP:5173` (Kasa ekranındaki **Telefon bağla** butonu adresi ve QR kodu gösterir)

Windows güvenlik duvarı Node.js için izin sorarsa **Özel ağlar** için izin verin.

### Test girişleri

| Personel | PIN |
| --- | --- |
| Garson 1 | 1111 |
| Garson 2 | 1112 |
| Kasa | 2222 |
| Mutfak | 3333 |
| Yönetici | 9999 |

Canlıya geçmeden PIN'leri değiştirin (aşağıda "PIN değiştirme").

## 4. Restoranda canlı kullanım

```
npm run build
npm start
```

Artık her şey tek adresten çalışır: `http://KASA-IP:3000` (kasada `http://localhost:3000`).

### Bilgisayar açılınca otomatik başlasın (PM2)

```
npm install -g pm2
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Windows açılışında PM2'yi geri getirmek için **Görev Zamanlayıcı → Temel Görev Oluştur**:

- Tetikleyici: **Oturum açtığımda**
- Eylem: **Program başlat**, Program: `cmd.exe`, Bağımsız değişkenler: `/c pm2 resurrect`

Ayrıca: güç ayarlarında uyku **Hiçbir zaman**, modemde kasa bilgisayarına **sabit IP (DHCP rezervasyonu)**.

### Günlük yedek

```
powershell -ExecutionPolicy Bypass -File scripts\yedek-al.ps1
```

Yedekler `C:\ToscanaYedek` klasörüne yazılır, 30 günden eskiler silinir. Görev Zamanlayıcı ile
her gece aynı komutu çalıştırın. Farklı disk için: `-Hedef "D:\ToscanaYedek"`.

## İnternette yayınlama (GitHub → Render, veritabanı Neon)

Böylece garsonlar farklı ağlardan (mobil veri dahil) QR kodla girebilir.

1. **GitHub**: github.com'da yeni bir **private** repo açın (ör. `toscana-pos`), sonra bu klasörde:
   ```
   git init
   git add .
   git commit -m "Toscana sipariş sistemi"
   git branch -M main
   git remote add origin https://github.com/KULLANICI/toscana-pos.git
   git push -u origin main
   ```
   `server/.env` `.gitignore` içinde olduğu için şifreler GitHub'a gitmez.
2. **Render**: render.com → **New → Blueprint** → repoyu seçin. `render.yaml` her şeyi ayarlar.
   Sizden yalnızca `DATABASE_URL` ister: Neon bağlantı adresini yapıştırın.
3. Kurulum bitince adres `https://toscana-xxxx.onrender.com` olur. Kasa ekranındaki **Telefon bağla**
   artık bu adresin QR kodunu gösterir.

Not: Render'ın ücretsiz planında 15 dakika kimse kullanmazsa servis uyur, ilk açılış ~1 dakika sürer.
Restoranda sürekli açık kalması için ücretli plan (Starter) gerekir. İnternet kesilirse sistem de çalışmaz.

## Faydalı komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run db:studio` | Prisma Studio: fiyat değiştirme, personel ekleme/kapatma |
| `npm run pin -w server -- 4821` | Yeni PIN'in şifreli halini üretir |
| `npm test` | Para ve KDV hesap testleri |
| `npm run typecheck` | TypeScript kontrolü |

### PIN değiştirme

1. `npm run pin -w server -- 4821` çalıştırın, çıkan uzun metni kopyalayın.
2. `npm run db:studio` → **Staff** tablosu → ilgili kişinin `pinHash` alanına yapıştırıp kaydedin.

## Sorun giderme

- **"Veritabanına bağlanılamadı"**: Windows Hizmetler'de `postgresql-x64-…` çalışıyor mu? `server/.env` içindeki şifre doğru mu?
- **Telefon sayfayı açmıyor**: Telefon aynı Wi-Fi'de mi? Adreste kasa bilgisayarının IP'si ve doğru port (geliştirmede 5173, canlıda 3000) var mı? Güvenlik duvarı izni verildi mi?
- **"Port 3000 kullanımda"**: Sunucu zaten açık olabilir (`pm2 list`).
- **Prisma 8 uyarısı**: Proje Prisma 7'ye sabitlidir. Elle komut çalıştırırken `npx prisma@7 …` yazın.

## Yasal not

Bu sistem iç sipariş ve hesap takibi içindir; mali belge üretmez. Ödemeden sonra fiş yazar kasadan
(yeni nesil ÖKC) veya e-Arşiv faturayla kesilir. Yazdırılan hesap "bilgi fişi"dir.

## Klasör yapısı

```
toscana/
├─ shared/   Ortak tipler, para/KDV hesabı, Socket.io event adları
├─ server/   Express + Socket.io + Prisma (PostgreSQL)
│  └─ prisma/  şema, migration'lar, seed
├─ client/   React + Redux Toolkit + Tailwind (garson, kasa, mutfak)
└─ scripts/  kurulum ve yedek betikleri
```
