// ══════════════════════════════════════════
//  IMPORTS
// ══════════════════════════════════════════
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ══════════════════════════════════════════
//  NAV SCROLL
// ══════════════════════════════════════════
window.addEventListener("scroll", () => {
  document
    .getElementById("mainNav")
    .classList.toggle("scrolled", window.scrollY > 60);
});

// ══════════════════════════════════════════
//  MOBILE NAV
// ══════════════════════════════════════════
window.openMobileNav = () =>
  document.getElementById("mobileNav").classList.add("open");
window.closeMobileNav = () =>
  document.getElementById("mobileNav").classList.remove("open");

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNavClose = document.getElementById("mobileNavClose");
const mobileLinks = document.querySelectorAll(".mobile-link");

if (hamburgerBtn) hamburgerBtn.addEventListener("click", window.openMobileNav);
if (mobileNavClose)
  mobileNavClose.addEventListener("click", window.closeMobileNav);
mobileLinks.forEach((link) =>
  link.addEventListener("click", window.closeMobileNav),
);

// ══════════════════════════════════════════
//  SCROLL REVEAL
// ══════════════════════════════════════════
const ro = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      const num = e.target.querySelector("[data-count]");
      if (num && !num.dataset.done) {
        num.dataset.done = "1";
        animateCount(num, parseInt(num.dataset.count));
      }
    });
  },
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((el) => ro.observe(el));

function animateCount(el, target) {
  let start = 0;
  const dur = 1800;
  const step = (ts) => {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - prog, 3);
    const val = Math.round(ease * target);
    el.textContent =
      target >= 1000
        ? val >= 1000
          ? (val / 1000).toFixed(1) + "K"
          : val
        : val;
    if (prog < 1) requestAnimationFrame(step);
    else el.textContent = target >= 1000 ? target / 1000 + "K" : target;
  };
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════
//  LOAD PRODUCTS FROM FIREBASE
// ══════════════════════════════════════════
const EMOJIS = [
  "fa-solid fa-shirt",
  "fa-solid fa-magic",
  "fa-solid fa-seedling",
  "fa-solid fa-scissors",
  "fa-solid fa-gem",
  "fa-solid fa-crown",
  "fa-solid fa-leaf",
  "fa-solid fa-award",
];
const GRADIENTS = [
  "linear-gradient(140deg,#1E3A5F,#2563EB)",
  "linear-gradient(140deg,#0D2E5A,#1A5FAA)",
  "linear-gradient(140deg,#162D4A,#1D4ED8)",
  "linear-gradient(140deg,#1A4080,#3B82F6)",
];

async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = `
    <div class="products-loading">
      <div class="spinner"></div>
      جاري تحميل المنتجات...
    </div>`;

  try {
    const q = query(collection(db, "products"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<div class="products-loading">لا توجد منتجات حالياً</div>`;
      return;
    }

    grid.innerHTML = "";
    snap.forEach((doc, i) => {
      const p = doc.data();
      const idx = i % GRADIENTS.length;
      grid.innerHTML += buildProductCard(doc.id, p, idx);
    });

    grid.querySelectorAll(".reveal").forEach((el) => ro.observe(el));
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="products-loading">حدث خطأ في تحميل المنتجات</div>`;
  }
}

function buildProductCard(id, p, idx) {
  const emojiClass = p.emoji || EMOJIS[idx % EMOJIS.length];
  const gradient = GRADIENTS[idx];
  const badge = p.badge ? `<div class="product-badge">${p.badge}</div>` : "";

  const imageElement = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">`
    : `<div class="product-emoji"><i class="${emojiClass}"></i></div>`;

  return `
  <div class="product-card reveal up reveal-d${(idx % 3) + 1}" data-id="${id}">
    <div class="product-img-area" style="background:${gradient}; position: relative; overflow: hidden;">
      ${imageElement}
      ${badge}
    </div>
    <div class="product-body">
      <span class="product-tag"> النوع: ${p.category || "أقمشة"}</span>
      <div class="product-name"> اسم المنتج: ${p.name}</div>
      <div class="product-color"> اللون: ${p.color}</div>
      <p class="product-desc"> الوصف: ${p.description || ""}</p>
      <div class="product-footer">
        <div class="product-price"> السعر: ${p.price} ج<small> / المتر</small></div>
        <button class="btn-order" onclick="openModal('${p.name}','${p.price}','${p.color}','${p.order}')">اطلبي الآن</button>
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════
//  ORDER MODAL
// ══════════════════════════════════════════
let currentProduct = "";
let currentPrice = "";
let currentColor = "";
let currentOrder = "";
var map;
var marker;
const homeLat = 26.096268983341027;
const homeLng = 32.4735349404724;
let selectedLat = homeLat;
let selectedLng = homeLng;
let customerLat = null;
let customerLng = null;
let customerLocationLink = "";

loadProducts();

function getCustomerLocation() {
  if (!navigator.geolocation) {
    alert("المتصفح لا يدعم تحديد الموقع.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      customerLat = position.coords.latitude;
      customerLng = position.coords.longitude;

      customerLocationLink = `https://www.google.com/maps?q=${customerLat},${customerLng}`;

      console.log("Customer Location:", customerLocationLink);
    },
    (error) => {
      console.error(error);
      alert("يرجى السماح للموقع حتى نستطيع تحديد عنوانك.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

window.openModal = (product, price, color, order) => {
  currentProduct = product;
  currentPrice = price;
  currentColor = color;
  currentOrder = order;
  document.getElementById("modalProductName").textContent = product;
  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";

  // الحصول على موقع العميل
  getCustomerLocation();

  ["fName", "fPhone", "fCity", "fAddress", "fMeters"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = id === "fMeters" ? 1 : "";
      el.classList.remove("error");
    }
  });
  document
    .querySelectorAll(".field-err")
    .forEach((e) => e.classList.remove("show"));

  if (typeof L !== "undefined") {
    if (!map) {
      map = L.map("map", { zoomControl: true }).setView(
        [selectedLat, selectedLng],
        16,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      marker = L.marker([selectedLat, selectedLng], { draggable: true })
        .addTo(map)
        .bindPopup("موقع المحل - المحمدي للأقمشة")
        .openPopup();
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        selectedLat = pos.lat;
        selectedLng = pos.lng;
      });
    } else {
      marker.setLatLng([selectedLat, selectedLng]);
      map.setView([selectedLat, selectedLng], 16);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }
};

window.closeModal = () => {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
};

window.handleOverlayClick = (e) => {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

const closeModalBtn = document.getElementById("closeModalBtn");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const btnMinus = document.getElementById("btnMinus");
const btnPlus = document.getElementById("btnPlus");

window.submitOrder = async () => {
  const name = document.getElementById("fName").value.trim();
  const phone = document.getElementById("fPhone").value.trim();
  const city = document.getElementById("fCity").value.trim();
  const addr = document.getElementById("fAddress").value.trim();
  const meters = parseInt(document.getElementById("fMeters").value) || 0;

const v1 = showErr("fName", "err-fName", name.length < 2);
const v2 = showErr("fPhone", "err-fPhone", !validatePhone(phone));
const v3 = showErr("fCity", "err-fCity", city.length < 2);
const v4 = showErr("fAddress", "err-fAddress", addr.length < 5);
const v5 = showErr("fMeters", "err-fMeters", meters < 1);

if (!(v1 && v2 && v3 && v4 && v5)) return;

// لو الموقع لسه متحددش نحاول نجيبه الآن
if (!customerLocationLink) {
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          customerLat = position.coords.latitude;
          customerLng = position.coords.longitude;

          customerLocationLink =
            `https://www.google.com/maps?q=${customerLat},${customerLng}`;

          resolve();
        },
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  } catch (err) {
    console.log("Location not available");
  }
}

const msg = `🛍 *طلب جديد من المحمدي للأقمشة*
━━━━━━━━━━━━━━━━━
📦 *ترتيب المنتج:* ${currentOrder}
🧵 *المنتج:* ${currentProduct}
📏 *عدد الأمتار:* ${meters} متر
💰 *السعر:* ${currentPrice} ج / المتر

👤 *بيانات العميلة:*
• الاسم: ${name}
• الموبايل: ${phone}
• لون المنتج: ${currentColor}
• المدينة: ${city}
• العنوان: ${addr}
━━━━━━━━━━━━━━━━━
📦 كاش عند الاستلام`;

  const waNumber = "201022819919";
  if (!waNumber || waNumber.includes("X") || waNumber.includes("x")) {
    alert(
      "يرجى ضبط رقم الواتساب في js/main.js داخل المتغير waNumber ليعمل الطلب.",
    );
    return;
  }

  let locationText = "📍 الموقع الحالي: لم يتم السماح بالوصول للموقع";

  if (customerLocationLink) {
    locationText = `📍 موقع العميل:\n${customerLocationLink}`;
  }

  const msgWithLocation = `${msg}

${locationText}`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(msgWithLocation)}`;

  closeModal();
  showToast();
  setTimeout(() => window.open(url, "_blank"), 600);
};

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (submitOrderBtn) submitOrderBtn.addEventListener("click", submitOrder);

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "btnMinus") {
    changeMeters(-1);
  } else if (e.target && e.target.id === "btnPlus") {
    changeMeters(1);
  }
});

window.changeMeters = (delta) => {
  const inp = document.getElementById("fMeters");
  if (!inp) return;
  let currentVal = parseInt(inp.value);
  if (isNaN(currentVal)) currentVal = 3;

  inp.value = Math.max(1, Math.min(50, currentVal + delta));
};

function showErr(id, errId, cond) {
  const el = document.getElementById(id);
  const er = document.getElementById(errId);
  if (cond) {
    if (el) el.classList.add("error");
    if (er) er.classList.add("show");
    return false;
  }
  if (el) el.classList.remove("error");
  if (er) er.classList.remove("show");
  return true;
}

function validatePhone(p) {
  return /^(010|011|012|015)\d{8}$/.test(p.replace(/\s/g, ""));
}

// ══════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════
function showToast() {
  const t = document.getElementById("successToast");
  if (!t) return;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ══════════════════════════════════════════
//  SUBSCRIBE
// ══════════════════════════════════════════
window.handleSubscribe = (btn) => {
  const inp = btn.previousElementSibling;
  if (!inp.value || !inp.value.includes("@")) {
    inp.style.borderColor = "rgba(255,80,80,.6)";
    setTimeout(() => (inp.style.borderColor = ""), 2000);
    return;
  }
  btn.textContent = "✓ تم الاشتراك!";
  btn.style.background = "#22C55E";
  btn.style.color = "#fff";
  inp.value = "";
  setTimeout(() => {
    btn.textContent = "اشتركي الآن 💌";
    btn.style.background = "";
    btn.style.color = "";
  }, 3000);
};
