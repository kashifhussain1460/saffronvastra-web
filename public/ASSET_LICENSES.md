# Saffron Vastra — Commercial Asset Licensing & Provenance Register

This document records the licensing, provenance, attribution, and technical specifications of all high-resolution fashion photography, video media, and category visuals integrated into the **Saffron Vastra** luxury e-commerce platform.

All visual assets utilized on Saffron Vastra comply strictly with commercial-use licensing requirements (Pexels License / Creative Commons Zero), permitting unrestricted commercial utilization, modification, display, and digital distribution without copyright restrictions or royalty encumbrances.

---

## 1. Homepage Hero Media Suite

### A. Ambient Fashion Hero Video Loop
- **Filename:** `/videos/hero/hero_fashion_loop.mp4`
- **Component Placement:** [HeroBanners.tsx](file:///d:/saff/Website/components/home/HeroBanners.tsx) — Homepage Hero Background Video
- **Source Platform:** Pexels Video
- **Source URL:** https://www.pexels.com/video/7684808/
- **Original Direct CDN:** https://videos.pexels.com/video-files/7684808/7684808-hd_1920_1080_30fps.mp4
- **Creator / Videographer:** RDNE Stock project (@rdne)
- **License:** Pexels License (Free for commercial use, No attribution required)
- **Technical Specs:** 1920 × 1080 Full HD @ 30fps, 8.24 MB, 13 seconds, H.264 / AAC
- **Editorial Wardrobe & Visual Description:** Fashion model in ornate royal gold and saffron embroidered handloom couture. Features graceful garment movement, artisan threadwork illumination, and natural fabric drape under warm luxury lighting.
- **Accessibility & Fallback:** Respects `prefers-reduced-motion: reduce` (pauses and hides video via CSS `motion-reduce:hidden` and JS observer). Includes WCAG 2.2.2 Pause/Play toggle controls.

### B. Hero Editorial Luxury Poster & Reduced-Motion Fallback
- **Filename:** `/images/hero/hero_luxury_editorial.jpg`
- **Component Placement:** [HeroBanners.tsx](file:///d:/saff/Website/components/home/HeroBanners.tsx) — Hero Poster & LCP Priority Image
- **Source Platform:** Pexels Photography
- **License:** Pexels License (Commercial Use Permitted)
- **Technical Specs:** 1920 × 1080 JPEG, 423 KB, Progressive MozJPEG
- **Editorial Wardrobe & Visual Description:** High-fashion luxury model in artisan embroidered royal gold and velvet couture against warm ambient tones. Serves as immediate LCP paint prior to video buffering.

---

## 2. Category & Subcategory Fashion Photography Suite

Every category and subcategory image strictly adheres to the enterprise requirement: **A real fashion model wearing the actual category-specific garment** (zero standalone fabric swatches, textile textures, or pattern-only close-ups).

### Collection 1: Suzani Stitchwork (Central Asian & Rajasthani Heritage)

| Asset File | Category | Creator / Photographer | Source URL | Native Res | Stored Res | Visual Description |
|---|---|---|---|---|---|---|
| `/images/categories/suzani-stitchwork.jpg` | **Suzani Stitchwork** *(Main Category)* | Konstantin Mishchenko (`@aksioart`) | [Pexels Photo 30133166](https://www.pexels.com/photo/traditional-uzbek-attire-outside-historic-building-30133166/) | 4080 × 3072 | 1200 × 1500 (4:5) | Fashion model in authentic hand-embroidered Uzbek Suzani gown and coat outside historic Samarkand carved wooden architecture. |
| `/images/categories/suzani-jackets.jpg` | **Suzani Jackets** *(Subcategory)* | Alexandre Canteiro (`@alexandrecanteiro`) | [Pexels Photo 33449608](https://www.pexels.com/photo/stylish-portrait-of-woman-in-vibrant-jacket-33449608/) | 3000 × 4000 | 1200 × 1500 (4:5) | Model wearing vibrant cropped Suzani folk-art embroidered jacket with artisanal floral medallions and contrast needlepoint. |
| `/images/categories/suzani-coats.jpg` | **Suzani Coats** *(Subcategory)* | Hewi (`@hewi`) | [Pexels Photo 40274440](https://www.pexels.com/photo/stylish-woman-in-embroidered-coat-at-sunset-40274440/) | 4000 × 6000 | 1200 × 1500 (4:5) | Fashion-forward model wearing longline embroidered Suzani coat during golden hour sunset, showing full-panel needlework. |
| `/images/categories/suzani-kimonos.jpg` | **Suzani Kimonos** *(Subcategory)* | Filipp Romanovski (`@filipp-romanovski-297235844`) | [Pexels Photo 31682335](https://www.pexels.com/photo/elegant-woman-in-colorful-kimono-against-red-wall-31682335/) | 4000 × 6000 | 1200 × 1500 (4:5) | Stylish model in flowing wrap kimono robe adorned with vivid botanical motifs and wide borders against deep terracotta backdrop. |
| `/images/categories/suzani-accessories.jpg` | **Suzani Accessories** *(Subcategory)* | MD Photography (`@md-photography-2150970498`) | [Pexels Photo 32823537](https://www.pexels.com/photo/elegant-traditional-attire-with-intricate-henna-design-32823537/) | 5472 × 3648 | 1200 × 1500 (4:5) | Model with ornate bridal henna on hands holding a handcrafted Suzani-embroidered and beaded luxury envelope clutch. |

---

### Collection 2: Kashmiri Kari (Himalayan Aari, Sozni & Paisley Flora)

| Asset File | Category | Creator / Photographer | Source URL | Native Res | Stored Res | Visual Description |
|---|---|---|---|---|---|---|
| `/images/categories/kashmiri-kari.jpg` | **Kashmiri Kari** *(Main Category)* | Amir Abbaspoor (`@amir-abbaspoor-1153396788`) | [Pexels Photo 31374289](https://www.pexels.com/photo/31374289/) | 4160 × 6240 | 1200 × 1500 (4:5) | Elegant model draped in opulent emerald green Kashmiri Aari embroidered wrap with dense floral vines against oriental architecture. |
| `/images/categories/kashmiri-jackets.jpg` | **Kashmiri Jackets** *(Subcategory)* | Roberto Junior (`@roberto-junior-481988429`) | [Pexels Photo 33309043](https://www.pexels.com/photo/stylish-portrait-of-woman-in-colorful-jacket-33309043/) | 2667 × 4000 | 1200 × 1500 (4:5) | Model in tailored structured jacket layered with vibrant multi-colored floral Kashmiri embroidery over crisp white gown. |
| `/images/categories/kashmiri-shawls.jpg` | **Kashmiri Shawls** *(Subcategory)* | Mehdi_ films (`@mehdi_-films-2155799171`, Srinagar) | [Pexels Photo 34058610](https://www.pexels.com/photo/elegant-woman-in-shawl-posed-in-sunny-srinagar-34058610/) | 4672 × 7008 | 1200 × 1500 (4:5) | Young Kashmiri model photographed in Srinagar gardens gracefully draped in authentic needle-embroidered pashmina shawl. |
| `/images/categories/kashmiri-kimonos.jpg` | **Kashmiri Kimonos** *(Subcategory)* | Ibrahim Abdullahi (`@ibrahim-abdullahi-2151213702`) | [Pexels Photo 35150034](https://www.pexels.com/photo/elegant-woman-in-traditional-black-abaya-35150034/) | 3648 × 5328 | 1200 × 1500 (4:5) | Model in graceful flowing open-front robe displaying intricate gold Kashmiri threadwork along lapels, cuffs, and sweeping hem. |
| `/images/categories/kashmiri-coats.jpg` | **Kashmiri Coats** *(Subcategory)* | Murat IŞIK (`@bymuratisikofficial`) | [Pexels Photo 40566481](https://www.pexels.com/photo/fashionable-woman-in-stylish-embroidered-coat-40566481/) | 4618 × 6927 | 1200 × 1500 (4:5) | Model wearing luxury heavy embroidered winter coat with ornate botanical lapels outside grand classical architecture. |

---

### Collection 3: Chikankari (Awadhi Shadow-Work & Tonal Needlecraft)

| Asset File | Category | Creator / Photographer | Source URL | Native Res | Stored Res | Visual Description |
|---|---|---|---|---|---|---|
| `/images/categories/chikankari.jpg` | **Chikankari** *(Main Category)* | Neha Mishra (`@neha-mishra-1437146522`, Lucknow) | [Pexels Photo 28512781](https://www.pexels.com/photo/28512781/) | 2598 × 3897 | 1200 × 1500 (4:5) | Model in authentic fine Chikankari shadow-work embroidered kurti photographed at historical architecture in Lucknow. |
| `/images/categories/chikankari-kurtas.jpg` | **Chikankari Kurtas** *(Subcategory)* | Neha Mishra (`@neha-mishra-1437146522`, Lucknow) | [Pexels Photo 28512776](https://www.pexels.com/photo/28512776/) | 2598 × 3897 | 1200 × 1500 (4:5) | Model wearing pristine classic white Lucknowi Chikankari kurta with intricate Bakhiya and Phanda tonal embroidery. |
| `/images/categories/chikankari-dresses.jpg` | **Chikankari Dresses** *(Subcategory)* | Neha Mishra (`@neha-mishra-1437146522`, Lucknow) | [Pexels Photo 28512773](https://www.pexels.com/photo/28512773/) | 2598 × 3897 | 1200 × 1500 (4:5) | Model in full-length flowing white Chikankari maxi dress with sheer embroidered panels and delicate floral vines. |
| `/images/categories/chikankari-shirts.jpg` | **Chikankari Shirts** *(Subcategory)* | Neha Mishra (`@neha-mishra-1437146522`, Lucknow) | [Pexels Photo 28512787](https://www.pexels.com/photo/28512787/) | 2598 × 3897 | 1200 × 1500 (4:5) | Model wearing contemporary pastel pistachio green Chikankari embroidered button-down tunic shirt with delicate tonal threadwork. |
| `/images/categories/chikankari-jackets.jpg` | **Chikankari Jackets** *(Subcategory)* | Hanna Alves (`@hanna-alves-1907982668`) | [Pexels Photo 28738352](https://www.pexels.com/photo/fashionable-woman-in-floral-embroidered-outfit-28738352/) | 3499 × 5472 | 1200 × 1500 (4:5) | Model in white cropped jacket adorned with tonal white floral embroidery and matching high-waisted tailored trousers. |

---

## 3. Image Optimization Standards Applied

1. **Resolution:** Master assets resized to **1200 × 1500 pixels** (4:5 portrait aspect ratio), providing optimal clarity across Retina mobile displays and desktop 4K monitors while matching editorial fashion aspect ratios.
2. **Compression:** Progressive JPEG encoded with `mozjpeg` algorithms at **quality 86**, achieving sharp fiber definition on embroidery stitches while maintaining lightweight page payload (~150 KB – ~380 KB per card).
3. **Framing & Focal Point:** Calibrated focal positioning (`position: top` or `center`) ensuring garments and models are impeccably composed without unintended cropping of necklines, bodices, or hemlines.
4. **Next.js Integration:** Rendered via `next/image` with responsive `sizes`, WebP/AVIF automated content negotiation, and lazy-loading for off-screen cards.

