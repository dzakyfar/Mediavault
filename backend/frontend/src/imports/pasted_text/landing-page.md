Raja Jawa Studio | Client Portal + Freelancer Marketplace

INSTRUKSI WAJIB UNTUK STITCH
Jangan halusinasi konten. Render hanya elemen yang dideskripsikan secara eksplisit. Jika sebuah elemen tidak disebutkan, kosongkan ruangnya — jangan isi dengan placeholder palsu.
Tampilkan SEMUA halaman sebagai frame terpisah dalam satu file. Setiap frame diberi label route-nya (contoh: "/" untuk Landing Page). Setiap tombol dan link HARUS terhubung ke frame tujuan yang benar. Tidak boleh ada tombol yang tidak terhubung.
Panah navigasi antar frame wajib ada — setiap interaksi yang berpindah halaman harus digambarkan dengan panah di Stitch agar alur terlihat jelas.
Total frame yang harus dirender: 26 frame (sesuai daftar di bawah, berurutan sesuai alur pengguna).

GLOBAL BRAND SYSTEM (berlaku untuk SEMUA halaman tanpa pengecualian)
Nama produk: MediaVault — Raja Jawa Studio Client Portal
Tagline: "Book. Shoot. Deliver."
Kepribadian: Bold, edgy, energik, terpercaya
Target user: Gen Z klien & freelance fotografer/videografer di Indonesia
COLOR SYSTEM (gunakan nilai ini secara konsisten di setiap frame):
Dark mode background:  #0A0A0A
Card surface level 1:  #141414
Card surface level 2:  #1A1A1A
Primary accent:        #F5C800 (electric yellow)
Muted/secondary text:  #888888
Border subtle:         #2A2A2A
Success:               #22C55E
Warning:               #F97316
Error:                 #EF4444
Info:                  #3B82F6
Light mode bg:         #F5F5F0
Light mode card:       #FFFFFF
Light mode text:       #0A0A0A
Accent (light mode):   #F5C800 (sama)
TYPOGRAPHY:
Headline font:           Bebas Neue atau Anton
Body/UI font:            DM Sans atau Syne
Hero headline:           80–100px desktop, 48px mobile
Section title:           48–64px Bebas Neue
Dashboard section:       24–32px Bebas Neue
Body text:               14–16px DM Sans
GLOBAL DESIGN RULES (berlaku di SEMUA frame):

Card border radius: 12px
Button border radius: 8px
Pills/badges border radius: 999px
Primary CTA hover: box-shadow: 0 0 20px rgba(245,200,0,0.4)
Semua hover transition: 0.2s ease
Card hover: translateY(-4px) + increased shadow
Input focus: border: #F5C800 + box-shadow: 0 0 0 3px rgba(245,200,0,0.15)
Subtle CSS noise/grain texture pada semua dark background
Mobile responsive — hamburger menu di mobile
Page transition: fade-in 0.3s ease antar semua frame

SIDEBAR DASHBOARD (berlaku identik di semua halaman dashboard):
Lebar:         240px fixed, full height
Background:    #141414
Border kanan:  1px solid #2A2A2A
Item aktif:    background #F5C800, teks hitam bold, full width
Item hover:    border kiri kuning 3px
Item nonaktif: teks #888888
TOP BAR DASHBOARD (berlaku identik di semua halaman dashboard):
Kiri:  Sapaan + tanggal kecil gray
Kanan: toggle dark/light + notif bell + avatar

URUTAN FRAME (26 halaman, berurutan sesuai alur pengguna)
GRUP A — PUBLIC PAGES (Frame 1–7)

FRAME 1 — LANDING PAGE
Route: /
Navigasi keluar dari halaman ini:

Logo → / (reload)
"Explore" (navbar) → Frame 6 /explore
"Pricing" (navbar) → Frame 7 /pricing
"Login" (navbar) → Frame 2 /login
"Get Started" (navbar) → Frame 3 /register
"Find a Photographer" (hero CTA) → Frame 6 /explore
"Become a Freelancer" (hero CTA) → Frame 3 /register?role=freelancer
"See All →" (featured freelancers) → Frame 6 /explore
"View Profile" (freelancer card) → Frame 26 /freelancer/[id]
Tile kategori Wedding → Frame 6 /explore?category=wedding
Tile kategori Product → Frame 6 /explore?category=product
Tile kategori Fashion → Frame 6 /explore?category=fashion
Tile kategori Corporate → Frame 6 /explore?category=corporate
Tile kategori Concert → Frame 6 /explore?category=concert
Tile kategori Real Estate → Frame 6 /explore?category=real-estate
"Start Earning Today" (for freelancers) → Frame 3 /register?role=freelancer
Footer "Post a Job" → Frame 25 /post-job
Footer "Search Talent" → Frame 6 /explore
Footer "Pricing" → Frame 7 /pricing
Footer "Join Pro" → Frame 3 /register?role=freelancer

Konten:
NAVBAR (sticky, blur on scroll):

Kiri: Logo "⚡ MediaVault" (ikon petir kuning, wordmark putih)
Tengah: Explore | How It Works | For Freelancers | Pricing
Kanan: toggle dark/light + "Login" (ghost button outline putih) + "Get Started" (filled yellow, rounded-full)

HERO SECTION:

Full-width dark #0A0A0A
Badge pills mengambang di atas headline (border kuning, fill dark): "⭐ 4.9 Rating" | "500+ Freelancers" | "2,000+ Projects Done"
Headline 2 baris Bebas Neue 80–100px:

Baris 1: "BOOK THE BEST." — kata "BEST" kuning #F5C800, sisanya putih
Baris 2: "SHOOT THE REST." — kata "REST" kuning, sisanya putih


Subheadline DM Sans 18px gray: "Indonesia's boldest platform for creative photography & video services."
Dua tombol CTA:

"Find a Photographer" (yellow bg, black bold) → /explore
"Become a Freelancer" (white outline, white text) → /register?role=freelancer


Background: mosaic grid foto portfolio gelap opacity 20%, overlay dark gradient
CSS grain texture overlay pada seluruh hero

HOW IT WORKS SECTION id="how-it-works":

Title: "Simple. Fast. No Cap." (Bebas Neue, besar, putih)
3 kartu horizontal, masing-masing #141414, radius 12px:

Step 1: ikon pensil kuning, angka "1" besar faded background, judul "Post Your Job", deskripsi "Drop your brief. Set your budget. Get ready for the pitch."
Step 2: ikon lensa kuning, angka "2" faded, judul "Pick Your Shooter", deskripsi "Review portfolios, compare rates, and hire the perfect match."
Step 3: ikon folder kuning, angka "3" faded, judul "Get Your Files", deskripsi "Secure payment. Fast delivery. High-res results via NAS."


Hover kartu: naik ke atas, border bawah kuning glowing
Kartu tidak dapat diklik — hanya informatif

FOR FREELANCERS SECTION id="for-freelancers":

Title: "Join 500+ Shooters Making Money on MediaVault" (Bebas Neue, besar, putih)
3 benefit items dengan ikon:

"Build Your Portfolio" — ikon galeri gambar
"Get Hired Fast" — ikon petir
"Secure Payments" — ikon perisai/kunci


Setiap benefit: ikon kuning, judul putih bold, deskripsi gray
CTA: "Start Earning Today" (yellow, black bold) → /register?role=freelancer

FEATURED FREELANCERS SECTION:

Title: "Top Shooters This Week" (Bebas Neue, besar, putih)
"See All →" link kuning kanan atas → /explore
Horizontal scroll carousel 4–5 kartu freelancer, masing-masing #141414 radius 12px:

Foto profil (rounded square)
Nama (bold putih)
Tag spesialisasi: "Wedding | Portrait" (gray pills kecil)
Rating: "⭐ 4.9"
Harga: "From Rp 500K" (kuning bold)
Tombol "View Profile" (outline) → /freelancer/[id]


Card hover: border kuning tipis muncul

CATEGORY GRID SECTION:

Title: "What Do You Need Shot?" (Bebas Neue, besar, putih)
6 tile grid (3 kolom × 2 baris): Wedding, Product, Fashion, Corporate, Concert, Real Estate
Setiap tile:

Background foto full-bleed (gelap dengan overlay)
Nama kategori Bebas Neue putih bold (kiri bawah)
Badge kuning "X Freelancers Available" (kanan bawah)
Hover: gambar zoom scale(1.05)
Dapat diklik → /explore?category=[kategori]



TESTIMONIAL STRIP:

Marquee/ticker horizontal scrolling ke kiri, otomatis
Quote pendek + avatar + nama
Background gelap, tanda kutip kuning besar di awal setiap quote
Dekoratif, tidak dapat diklik

FOOTER:

Background gelap, layout 4 kolom
Kolom 1: Logo + tagline + deskripsi singkat
Kolom 2 "Company": About Us | Careers | Contact
Kolom 3 "For Clients": Post a Job → Frame 25 | Search Talent → Frame 6 | Pricing → Frame 7
Kolom 4 "For Freelancers": Join Pro → Frame 3 | Success Stories | Community
Ikon sosial: Instagram, TikTok, Twitter/X
Bar bawah: "© 2026 MediaVault. Made in Surabaya 🇮🇩" (centered, gray)


FRAME 2 — LOGIN
Route: /login
Navigasi:

"Sign up free" link → Frame 3 /register
"Log In" button (sukses) → Frame 4 /role-select
"Forgot password?" → Frame halaman lupa password (tidak termasuk dalam 26 frame, link saja)
"Create account" link → Frame 3 /register

Layout: Split screen 50/50 horizontal
Panel Kiri (dekoratif, #0A0A0A):

Logo "⚡ MediaVault" kiri atas
Tagline: "Your next shoot starts here." (Bebas Neue, besar, putih)
Kolase foto portfolio berputar: 3–4 gambar fade bergantian setiap 3 detik
Overlay gradient kuning dari bawah gambar
Tersembunyi di mobile (stacking vertikal)

Panel Kanan (form login, #141414):

Logo kecil (mobile only)
Heading: "Welcome back." (Bebas Neue 48px, putih)
Sub: "Don't have an account? " + "Sign up free" (kuning, underline hover) → Frame 3
Tombol "Continue with Google" (putih bg, teks hitam, ikon Google kiri, full width, rounded-full)
Divider: garis tipis + "or" centered gray
Field Email:

Label "Email" (gray kecil)
Fill #1A1A1A, border #2A2A2A, placeholder "your@email.com" gray
Focus: border #F5C800 + glow


Field Password:

Label "Password" (gray kecil)
Gaya dark sama
Kanan: toggle show/hide ikon mata
Focus: glow kuning sama


"Forgot password?" link gray, right-aligned
Tombol "LOG IN" (kuning #F5C800, teks hitam bold, full width, 48px)

Sukses → Frame 4 /role-select
Error: border merah #EF4444, pesan error "Incorrect email or password." di bawah field


Teks bawah: "New here? " + "Create account" (kuning) → Frame 3


FRAME 3 — REGISTER
Route: /register dan /register?role=freelancer
Navigasi:

"Log in" link → Frame 2 /login
"Create Account" button (sukses) → Frame 4 /role-select
"Terms of Service" link → halaman terms (eksternal)
"Privacy Policy" link → halaman privacy (eksternal)

Layout: Split screen 50/50 identik dengan Login
Panel Kiri: Identik dengan Login (kolase foto rotating)
Panel Kanan (form register, #141414):

Heading: "Create your account." (Bebas Neue 48px, putih)
Tombol "Continue with Google" (gaya identik dengan Login)
Divider "or"
Field-field (semua dark fill, focus glow kuning):

Full Name — label "Full Name", placeholder "Budi Santoso"
Email — label "Email", placeholder "your@email.com"
Password — label "Password", placeholder "Min. 8 characters", toggle show/hide
Confirm Password — label "Confirm Password", toggle show/hide

Validasi: jika tidak cocok → border merah + "Passwords don't match"




Baris checkbox Terms:

Checkbox (kuning saat dicentang) + "I agree to the " + "Terms of Service" (kuning) + " and " + "Privacy Policy" (kuning)


Tombol "Create Account" (kuning, hitam bold, full width, 48px)

Sukses → Frame 4 /role-select
Error: border merah per field, pesan error di bawah masing-masing field


Teks bawah: "Already have an account? " + "Log in" (kuning) → Frame 2


FRAME 4 — ROLE SELECTION
Route: /role-select
Navigasi:

Pilih Client → "Continue" → Frame 5 /dashboard/client
Pilih Freelancer → "Continue" → Frame 14 /dashboard/freelancer
Pilih Keduanya → "Continue" → Frame 5 /dashboard/client

Layout: Full screen centered, background #0A0A0A

Logo "⚡ MediaVault" top-center
Heading: "How will you use MediaVault?" (Bebas Neue 64px, putih, centered)
Subheading: "You can always switch later." (DM Sans gray, centered)
Dua kartu besar side by side (masing-masing ~320px, #141414, radius 12px, border #2A2A2A):
Kartu Kiri — Client:

Ikon shopping bag (besar, kuning, centered atas)
Judul: "I'm a Client" (bold putih 24px)
Deskripsi: "I want to book photographers and videographers for my projects."
Tag pills: "Wedding" | "Product Shoot" | "Event" | "Corporate"
State default: border #2A2A2A
State hover: border #F5C800, glow, scale(1.02)
State selected: border #F5C800, checkmark badge kuning sudut kanan atas

Kartu Kanan — Freelancer:

Ikon kamera/lensa (besar, kuning, centered atas)
Judul: "I'm a Freelancer" (bold putih 24px)
Deskripsi: "I want to offer my photography or video services and get hired."
Tag pills: "Build Portfolio" | "Get Clients" | "Earn Money"
State identik dengan kartu Client


Link di bawah kartu: "I'm both — Client & Freelancer" (teks kuning, centered) — memilih keduanya
Tombol "CONTINUE" (kuning, hitam bold, max-width 400px centered, 56px):

State disabled (gray) saat belum ada pilihan
Aktif setelah memilih
Routing sesuai pilihan (lihat navigasi di atas)


Catatan bawah: "You can switch roles anytime from your dashboard settings." (gray kecil, centered)


FRAME 5 — EXPLORE / FIND FREELANCER
Route: /explore
Navigasi:

"View Profile" pada kartu → Frame 26 /freelancer/[id]
Login/navbar → Frame 2
Logo → Frame 1

Layout: Full page dengan navbar identik Landing Page
Konten:

Header: "Find Your Shooter" (Bebas Neue, besar, putih)
Filter bar:

Search input (dark fill, placeholder "Search by name, skill, city...")
Dropdown filter: Kategori, Harga, Rating, Kota
Toggle: "Available Only" (switch kuning)


Grid hasil freelancer (3–4 kolom), setiap kartu identik dengan Featured Freelancers di Landing:

Foto, nama, spesialisasi, rating, harga mulai
"View Profile" → Frame 26


Pagination atau infinite scroll di bawah


FRAME 6 — PRICING
Route: /pricing
Navigasi:

"Get Started" / "Choose Plan" → Frame 3 /register
Logo/navbar → Frame 1, Frame 2, Frame 6

Konten:

Header: "Simple Pricing. No Hidden Fees." (Bebas Neue)
Toggle: "Monthly / Yearly" (kuning switch)
3 kolom paket:

Free — Rp 0/bulan: 1 postingan job, 3 pesan/bulan, fitur dasar
Pro — Rp 99K/bulan: unlimited job, pesan tak terbatas, badge verifikasi, prioritas support
Studio — Rp 299K/bulan: semua Pro + NAS storage 1TB, multi-user, laporan analytics
Kartu Pro: highlighted dengan border kuning tebal, badge "Most Popular"
Tombol "Get Started" di setiap kartu → Frame 3




GRUP B — CLIENT DASHBOARD (Frame 7–13)

FRAME 7 — CLIENT DASHBOARD OVERVIEW
Route: /dashboard/client
Navigasi sidebar:

Overview → Frame 7 (aktif)
My Projects → Frame 8
Find Freelancer → Frame 5 /explore
Messages → Frame 10
Notifications → Frame 11
Payments → Frame 12
Settings → Frame 13
Switch to Freelancer → Frame 14
Log Out → Frame 2

Navigasi konten:

Bell notifikasi → Frame 11
Avatar → Frame 13
"Post New Job +" → Frame 25
"View" pada project card → Frame 9
"Message" pada project card → Frame 10
"Pay Now" → Frame 12
"View Profile" pada recommended freelancer → Frame 26
"Download All" → modal overlay (tidak berpindah halaman)

Layout: Sidebar 240px fixed + area konten scrollable
SIDEBAR:

Logo "⚡ MediaVault" atas
Avatar 48px circular + "Rania K." + badge "Client" (kuning pill)
Navigasi (lihat di atas), "Overview" dalam kondisi AKTIF (bg kuning, teks hitam)
Bawah: "Switch to Freelancer" (link gray) + "Log Out" (link merah tinted)

TOP BAR:

Kiri: "Good morning, Rania 👋" (DM Sans 20px putih bold) + tanggal saat ini (gray kecil di bawah)
Kanan: toggle dark/light + bell notifikasi + avatar

STATS ROW (4 kartu horizontal, lebar sama):

Kartu 1 — Active Projects: nilai "3" (kuning besar bold), label "Active Projects", ikon 📋 kuning, aksen border kiri kuning
Kartu 2 — Pending Payment: nilai "Rp 1.500.000" (kuning besar bold), label "Pending Payment", ikon 💳 kuning, aksen border kiri kuning
Kartu 3 — Files Ready: nilai "7 Files" (hijau besar bold), label "Files Ready", ikon 📁 hijau, aksen border kiri hijau, link "Download All" kecil di bawah nilai
Kartu 4 — Unread Messages: nilai "5" (biru besar bold), label "Unread Messages", ikon 💬 biru, aksen border kiri biru, dapat diklik → Frame 10
Setiap kartu: #1A1A1A bg, radius 12px, border #2A2A2A, padding 16px

ACTIVE PROJECTS SECTION:

Title: "Your Active Projects" (Bebas Neue 28px putih)
Tombol "Post New Job +" kuning (kanan) → Frame 25
3 kartu proyek list view, masing-masing #1A1A1A radius 12px:

Kartu 1: Avatar freelancer 36px + "Fauzan A." + judul "Brand Product Shoot — Maret 2026" | Badge "In Progress" (kuning bg hitam) + progress bar 60% kuning + "Due: 10 Mar 2026" | Tombol: "View" → Frame 9, "Message" → Frame 10, "Download" (outline hijau) → modal
Kartu 2: "Nathanael V." + "Wedding Documentation — Rania & Budi" | Badge "Under Review" (biru bg putih) + progress 90% + "Due: 5 Mar 2026" | Tombol sama
Kartu 3: "Dzaky F." + "Corporate Headshots — PT. Maju Jaya" | Badge "Waiting Payment" (oranye bg putih) + progress 100% + "Due: 1 Mar 2026" | Tombol "Pay Now" (kuning) → Frame 12


Card hover: border kiri kuning 3px, bg sedikit lebih terang

RECOMMENDED FREELANCERS SECTION:

Title: "Handpicked for You" (Bebas Neue 28px putih)
Horizontal scroll 4 kartu freelancer #141414:

Foto, nama, tag spesialisasi, "⭐ 4.9", "From Rp 500K"
"View Profile" → Frame 26



RECENT ACTIVITY FEED:

Title: "Recent Activity" (Bebas Neue 28px putih)
Timeline vertikal, setiap item 48px:

🟡 "Fauzan uploaded 3 files to Brand Product Shoot" | "2 hours ago"
🟢 "Payment of Rp 500K confirmed for Wedding Doc" | "Yesterday"
🟡 "New message from Nathanael V." | "Yesterday"
⚪ "Project 'Corporate Headshots' marked complete" | "3 days ago"
⚪ "Invoice #INV-2026-003 generated" | "4 days ago"


Dot kuning = baru/belum dibaca, dot gray = lama
Tidak dapat diklik

Mobile: Sidebar collapse ke bottom tab bar ikon saja: 🏠 📋 🔍 💬 ⚙️

FRAME 8 — MY PROJECTS (CLIENT)
Route: /dashboard/client/projects
Navigasi sidebar: "My Projects" dalam kondisi AKTIF
Navigasi konten:

"Post New Job +" → Frame 25
"View Detail" → Frame 9
"Send Message" → Frame 10
"Pay Now" → Frame 12

Layout: Sidebar identik + konten
TOP BAR: Identik semua dashboard
PAGE HEADER:

Title: "My Projects" (Bebas Neue 40px putih)
Tombol "Post New Job +" kuning (kanan) → Frame 25

FILTER TABS (horizontal pills):
All | In Progress | Under Review | Completed | Waiting Payment

Tab aktif: bg kuning, teks hitam | Nonaktif: bg dark, teks gray
Klik tab → filter list (tidak berpindah halaman)

PROJECTS LIST:
Setiap kartu proyek #1A1A1A radius 12px, expanded detail:

Baris 1: Judul proyek (bold putih 18px) + badge status (kanan)
Baris 2: Avatar freelancer + "by Fauzan A." + "📍 Surabaya"
Baris 3: Progress bar kuning full width + label persentase
Baris 4: "📅 Deadline: 10 Mar 2026" + "📁 3 Files Uploaded" + "💳 Rp 1.500.000"
Baris 5 (tombol, right-aligned):

"View Detail" (outline) → Frame 9
"Send Message" (outline) → Frame 10
"Download Files" (outline hijau) → modal download
"Pay Now" (kuning, hanya muncul jika status = Waiting Payment) → Frame 12



EMPTY STATE:

Ilustrasi centered + "You haven't posted any jobs yet."
"Post Your First Job" (kuning) → Frame 25


FRAME 9 — PROJECT DETAIL (CLIENT POV)
Route: /dashboard/client/projects/[id]
Navigasi sidebar: "My Projects" tetap AKTIF
Navigasi konten:

Breadcrumb "Dashboard" → Frame 7
Breadcrumb "My Projects" → Frame 8
"Message Freelancer" → Frame 10
"Pay Now" → Frame 12
"Download" file → modal/aksi download

Layout: Sidebar identik + konten penuh (tidak ada sub-kolom)
BREADCRUMB: "Dashboard → My Projects → Brand Product Shoot" (link gray kecil)
PROJECT HEADER CARD (#141414, full width):

Kolom kiri:

Judul: "Brand Product Shoot — Maret 2026" (Bebas Neue 32px putih)
Badge status: "IN PROGRESS" (pill kuning)
Progress bar kuning, label "60% Complete"
Baris info: "📅 Deadline: 10 Mar 2026" | "📍 Surabaya" | "💳 Rp 1.500.000"


Kolom kanan:

Avatar freelancer circular 64px
Nama: "Fauzan Ardiansyah" (bold putih)
Spesialisasi: "Product & Commercial" (gray)
Rating: "⭐ 4.9 (47 reviews)"
Tombol: "Message Freelancer" (outline) → Frame 10



TABS KONTEN (horizontal):
Overview | Files | Timeline | Payment
Tab Overview (default aktif):

Brief proyek: "Foto produk untuk campaign Ramadhan brand kosmetik lokal. Output 30 foto edited high-res."
Scope items checklist:

✅ Pre-production meeting (done)
✅ Location scouting (done)
🟡 Main shoot day (in progress)
⬜ Photo editing
⬜ Final delivery



Tab Files:

Grid file yang diupload freelancer
Setiap item: thumbnail + nama file + ukuran + tombol download
Tombol "Download All" (kuning)
Upload section untuk client jika ada referensi

Tab Timeline:

Vertical timeline aktivitas proyek
Setiap event: dot warna + deskripsi + timestamp

Tab Payment:

Ringkasan pembayaran
"Pay Now" button (kuning) jika ada pending → Frame 12


FRAME 10 — MESSAGES (CLIENT)
Route: /dashboard/client/messages
Navigasi sidebar: "Messages" AKTIF
Layout: Sidebar identik + split panel pesan
Panel kiri (daftar konversasi, 280px):

Search input "Search conversations..."
List konversasi, setiap item:

Avatar freelancer + nama + preview pesan terakhir (gray, truncated)
Timestamp + badge unread (kuning circle dengan angka)
Item aktif: bg #1A1A1A, border kiri kuning



Panel kanan (chat aktif):

Header: foto + nama + status "Online" (titik hijau)
Area chat bubble:

Bubble client: kanan, bg kuning #F5C800, teks hitam
Bubble freelancer: kiri, bg #1A1A1A, teks putih, border #2A2A2A
Timestamp gray kecil di bawah setiap bubble


Input area bawah:

Input teks (dark fill)
Ikon attachment (paperclip)
Tombol kirim (kuning, ikon panah)




FRAME 11 — NOTIFICATIONS (CLIENT)
Route: /dashboard/client/notifications
Navigasi sidebar: "Notifications" AKTIF
Layout: Sidebar identik + konten
PAGE HEADER: "Notifications" (Bebas Neue 40px) + tombol "Mark All Read" (outline gray, kanan)
LIST NOTIFIKASI:
Setiap item (bg #1A1A1A, radius 12px, padding 16px):

Dot indikator kiri (kuning = belum dibaca, gray = sudah)
Ikon tipe notifikasi (📁 file, 💬 pesan, 💳 pembayaran, ✅ proyek)
Teks notifikasi + waktu (gray kanan)
Unread items: bg sedikit lebih terang

Contoh notifikasi:

🟡 "Fauzan uploaded 3 new files to Brand Product Shoot" — 2 hours ago
🟡 "New message from Nathanael V." — 3 hours ago
⚪ "Payment Rp 500K confirmed" — Yesterday
⚪ "Project Corporate Headshots marked complete" — 3 days ago
⚪ "New invoice #INV-2026-003 generated" — 4 days ago


FRAME 12 — PAYMENTS & INVOICES (CLIENT)
Route: /dashboard/client/payments
Navigasi sidebar: "Payments" AKTIF
Navigasi konten:

"View Invoice" → Frame 13 payment detail

Layout: Sidebar identik + konten
PAGE HEADER: "Payments & Invoices" (Bebas Neue 40px putih)
SUMMARY CARDS (3 horizontal):

Total Spent: "Rp 4.500.000" (kuning bold besar)
Pending: "Rp 1.500.000" (oranye bold besar)
Last Payment: "Rp 500.000" + "5 Mar 2026" (putih)

PAYMENT LIST:
Setiap item kartu #1A1A1A:

Judul proyek + nama freelancer
Invoice ID: #INV-2026-003
Tanggal + jumlah (kuning bold)
Badge status: Paid (hijau), Pending (oranye), Overdue (merah)
Tombol "View Invoice" (outline) → Frame 13


FRAME 13 — PAYMENT DETAIL / INVOICE (CLIENT)
Route: /dashboard/client/payments/[id]
Navigasi sidebar: "Payments" tetap AKTIF
Navigasi:

Breadcrumb "Payments" → Frame 12
"Pay Now" → payment gateway (mock)
"Download PDF" → unduh invoice

Layout: Sidebar identik + konten
BREADCRUMB: "Dashboard → Payments → Invoice #INV-2026-001"
INVOICE CARD (#141414, max-width ~720px centered):

Header invoice: Logo MediaVault kiri + "INVOICE" (Bebas Neue besar, kanan)
Info: Invoice #INV-2026-001 | Tanggal: 1 Mar 2026 | Due: 10 Mar 2026
Dari: Raja Jawa Studio — MediaVault Platform
Kepada: Rania K. + email + nomor telepon
Tabel line items:

Header: Deskripsi | Qty | Harga Satuan | Total
Row 1: Brand Product Shoot | 1 | Rp 1.500.000 | Rp 1.500.000
Row 2: Platform Fee (5%) | — | — | Rp 75.000
Subtotal: Rp 1.575.000
TOTAL: Rp 1.575.000 (besar kuning bold)


Status badge: "PENDING PAYMENT" (oranye pill besar)
Tombol aksi bawah:

"Pay Now" (kuning, penuh) → payment gateway
"Download PDF" (outline)




FRAME 14 — CLIENT SETTINGS
Route: /dashboard/client/settings
Navigasi sidebar: "Settings" AKTIF
Layout: Sidebar identik + konten
PAGE HEADER: "Account Settings" (Bebas Neue 40px)
SECTIONS:

Profile: foto avatar (upload), nama, email, nomor telepon, kota — tombol "Save Changes" (kuning)
Security: ubah password, toggle 2FA
Notifications: toggle tiap tipe notifikasi
Payment Methods: kartu tersimpan, tambah metode
Danger Zone: "Delete Account" (tombol merah outline)


GRUP C — FREELANCER DASHBOARD (Frame 15–22)

FRAME 15 — FREELANCER DASHBOARD OVERVIEW
Route: /dashboard/freelancer
Navigasi sidebar:

Overview → Frame 15 (AKTIF)
Job Requests → Frame 16
My Projects → Frame 17
Portfolio → Frame 19
Earnings → Frame 20
Messages → Frame 21
Settings → Frame 22
Switch to Client → Frame 7
Log Out → Frame 2

Navigasi konten:

Bell → Frame notifikasi (freelancer)
Avatar → Frame 22
"View Request" → Frame 16
"View Project" → Frame 18

Layout: Sidebar 240px + konten. Sidebar identik strukturnya dengan Client, namun dengan nama menu yang berbeda.
USER SIDEBAR: Avatar + "Fauzan A." + badge "Freelancer" (kuning pill)
TOP BAR: "Good morning, Fauzan 👋" + tanggal
STATS ROW (4 kartu horizontal):

Kartu 1: Active Projects — "3" (kuning)
Kartu 2: Pending Earnings — "Rp 2.250.000" (kuning)
Kartu 3: New Requests — "5" (biru)
Kartu 4: Portfolio Views — "128" (hijau)

ACTIVE PROJECTS SECTION:

Title: "Your Active Projects" (Bebas Neue 28px)
3 kartu proyek list:

Nama klien + judul proyek + status badge + progress bar + deadline
Tombol: "View" → Frame 18, "Message" → Frame 21



NEW JOB REQUESTS SECTION:

Title: "New Requests" (Bebas Neue 28px)
"See All →" → Frame 16
3 kartu request:

Judul job + nama klien + budget + kategori + tanggal post
Tombol: "Accept" (kuning) + "Decline" (outline merah)




FRAME 16 — JOB REQUESTS (FREELANCER)
Route: /dashboard/freelancer/requests
Navigasi sidebar: "Job Requests" AKTIF
Layout: Sidebar identik + konten
PAGE HEADER: "Job Requests" (Bebas Neue 40px)
FILTER TABS: All | New | Accepted | Declined
REQUEST CARDS:
Setiap kartu #1A1A1A expanded:

Judul pekerjaan (bold putih 18px) + badge kategori (kuning pill)
Nama klien + kota + anggaran "Rp 1.500.000"
Deskripsi singkat (2 baris, gray)
Deadline + tanggal posting
Tombol: "Accept Request" (kuning) | "Decline" (outline merah)
Kartu yang sudah accepted: badge "Accepted" hijau, tombol berubah "View Project" → Frame 18


FRAME 17 — MY PROJECTS (FREELANCER)
Route: /dashboard/freelancer/projects
Navigasi sidebar: "My Projects" AKTIF
Navigasi konten:

"View Detail" → Frame 18

Layout: Sidebar identik + konten
PAGE HEADER: "My Projects" (Bebas Neue 40px)
FILTER TABS: All | In Progress | Completed | Pending Review
PROJECT CARDS: Identik strukturnya dengan Client My Projects namun dari sudut pandang freelancer:

Nama klien (bukan freelancer)
Tombol: "View Detail" → Frame 18, "Upload Files" → modal upload, "Request Payment" (kuning)


FRAME 18 — PROJECT DETAIL (FREELANCER POV)
Route: /dashboard/freelancer/projects/[id]
Navigasi sidebar: "My Projects" AKTIF
Layout: Sidebar identik + konten penuh
Konten: Serupa dengan Frame 9 (Project Detail Client), namun:

Kolom kanan menampilkan info klien (bukan freelancer)
Tersedia tombol "Upload Files" (kuning) di tab Files
Tersedia tombol "Request Payment" jika pekerjaan selesai
Tidak ada tombol "Pay Now" (itu hak klien)


FRAME 19 — PORTFOLIO MANAGER (FREELANCER)
Route: /dashboard/freelancer/portfolio
Navigasi sidebar: "Portfolio" AKTIF
Layout: Sidebar identik + konten
PAGE HEADER: "My Portfolio" (Bebas Neue 40px) + "Add Work +" (kuning kanan)
PORTFOLIO GRID (3 kolom masonry):
Setiap item kartu:

Foto full-bleed
Hover overlay: judul + kategori + tombol "Edit" | "Delete"
Badge kategori (pill kuning kecil, pojok atas kiri)

TAMBAH KARYA (modal/form):

Upload foto (drag & drop zone)
Field: Judul, Kategori, Deskripsi, Tags
Tombol "Save to Portfolio" (kuning)

PROFILE PREVIEW SECTION:

Preview bagaimana profile publik akan terlihat
Tombol "View Public Profile" → Frame 26


FRAME 20 — EARNINGS (FREELANCER)
Route: /dashboard/freelancer/earnings
Navigasi sidebar: "Earnings" AKTIF
Layout: Sidebar identik + konten
PAGE HEADER: "Earnings" (Bebas Neue 40px)
SUMMARY CARDS (3 horizontal):

Total Earned: "Rp 12.500.000" (kuning bold besar)
This Month: "Rp 2.250.000" (kuning)
Pending: "Rp 750.000" (oranye)

CHART (bar chart bulanan, 6 bulan terakhir):

Bar kuning untuk earned, bar oranye untuk pending
Axis horizontal: nama bulan, axis vertikal: jumlah (Rp)

TRANSACTION LIST:
Setiap item:

Nama klien + judul proyek
Tanggal + jumlah (kuning)
Badge status: Received (hijau), Pending (oranye)

WITHDRAWAL BUTTON: "Withdraw Funds" (kuning besar) → modal konfirmasi

FRAME 21 — MESSAGES (FREELANCER)
Route: /dashboard/freelancer/messages
Navigasi sidebar: "Messages" AKTIF
Layout dan konten: Identik dengan Frame 10 (Messages Client), namun perspektif dibalik:

Bubble freelancer di kanan (kuning)
Bubble klien di kiri (dark)


FRAME 22 — SETTINGS (FREELANCER)
Route: /dashboard/freelancer/settings
Navigasi sidebar: "Settings" AKTIF
Layout: Sidebar identik + konten
Konten: Identik strukturnya dengan Frame 14 (Client Settings), namun dengan tambahan section:

Professional Info: Spesialisasi, bio, harga mulai, kota operasional
Bank Account: Rekening untuk pencairan dana


GRUP D — SHARED PAGES (Frame 23–26)

FRAME 23 — POST NEW JOB
Route: /post-job
Navigasi:

"Publish Job" (sukses) → Frame 7 /dashboard/client
Cancel → Frame 7
Siapa yang bisa akses: Hanya klien yang sudah login

Layout: Sidebar identik Client + konten form multi-step
PAGE HEADER: "Post a New Job" (Bebas Neue 40px)
STEP INDICATOR (3 langkah):
① Job Details → ② Budget & Timeline → ③ Review & Publish
STEP 1 — Job Details:

Field: Judul Pekerjaan | Kategori (dropdown) | Deskripsi (textarea) | Referensi (upload)

STEP 2 — Budget & Timeline:

Budget range slider (Rp 500K – Rp 10M)
Tanggal deadline (date picker)
Preferensi lokasi (dropdown kota)

STEP 3 — Review & Publish:

Preview semua detail
Tombol "Publish Job" (kuning besar) → Frame 7


FRAME 24 — FREELANCER PUBLIC PROFILE
Route: /freelancer/[id]
Navigasi:

"Hire Now" / "Request Quote" → Frame 25 atau login check → Frame 2 jika belum login

Layout: Full page dengan navbar identik Landing Page
KONTEN:
HERO PROFILE:

Foto cover background (darkened)
Avatar circular besar (120px) di atas foto cover
Nama: "Fauzan Ardiansyah" (Bebas Neue 48px putih)
Tagline: "Commercial & Product Photographer | Surabaya"
Rating: "⭐ 4.9" + "(47 reviews)"
Badge: "✓ Verified" (hijau)
Dua tombol: "Hire Now" (kuning besar) | "Send Message" (outline)

STATS BAR:

"128 Projects Done" | "Rp 500K Starting Price" | "< 24h Response Time" | "100% Completion Rate"

TABS: Portfolio | About | Reviews | Packages
Tab Portfolio (default):

Masonry grid foto karya (filter kategori di atas)
Hover: overlay judul proyek

Tab About:

Bio lengkap
Equipment yang digunakan
Area layanan
Skills/tags

Tab Reviews:

Daftar review klien: avatar + nama + rating bintang + komentar + tanggal

Tab Packages:

Kartu paket layanan (Basic / Standard / Premium)
Setiap paket: judul, deskripsi, output, harga, tombol "Book This Package" (kuning) → Frame 25


ROUTING SUMMARY (26 Frame Berurutan)
FrameNama HalamanRoute1Landing Page/2Login/login3Register/register4Role Selection/role-select5Find Freelancer / Explore/explore6Pricing/pricing7Client Dashboard/dashboard/client8My Projects (Client)/dashboard/client/projects9Project Detail (Client)/dashboard/client/projects/[id]10Messages (Client)/dashboard/client/messages11Notifications (Client)/dashboard/client/notifications12Payments & Invoices/dashboard/client/payments13Payment Detail / Invoice/dashboard/client/payments/[id]14Settings (Client)/dashboard/client/settings15Freelancer Dashboard/dashboard/freelancer16Job Requests/dashboard/freelancer/requests17My Projects (Freelancer)/dashboard/freelancer/projects18Project Detail (Freelancer)/dashboard/freelancer/projects/[id]19Portfolio Manager/dashboard/freelancer/portfolio20Earnings/dashboard/freelancer/earnings21Messages (Freelancer)/dashboard/freelancer/messages22Settings (Freelancer)/dashboard/freelancer/settings23Post New Job/post-job24Freelancer Public Profile/freelancer/[id]