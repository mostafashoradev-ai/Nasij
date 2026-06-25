import { db, auth } from './firebase.js';
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('productForm');
const saveProductBtn = document.getElementById('saveProductBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const productTableContainer = document.getElementById('productTableContainer');
const adminEmpty = document.getElementById('adminEmpty');

const productFields = {
  id: document.getElementById('currentProductId'),
  name: document.getElementById('prodName'),
  category: document.getElementById('prodCategory'),
  price: document.getElementById('prodPrice'),
  badge: document.getElementById('prodBadge'),
  imageUrl: document.getElementById('prodImageUrl'), 
  color: document.getElementById('prodColor'),
  description: document.getElementById('prodDesc'),
};

const productsRef = collection(db, 'products');

// دالة سحرية لتقليص حجم الصورة وضغطها لتناسب حدود الـ Firestore المجانية
function compressAndConvertToBase64(file, maxWidth = 400, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // تغيير الأبعاد لضمان صغر الحجم
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // ضغط الصورة بصيغة jpeg وجودة 60% لتقليل المساحة تماماً
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function showLoginError(message) {
  if (!loginError) return;
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function hideLoginError() {
  if (!loginError) return;
  loginError.textContent = '';
  loginError.style.display = 'none';
}

if (loginForm) {
  onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'dashboard.html';
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    hideLoginError();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) {
      showLoginError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showLoginError('فشل تسجيل الدخول. تأكدي من بياناتك وحاولي مرة أخرى.');
      console.error(err);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });
}

function resetProductForm() {
  if (!productFields.name) return;
  productFields.id.value = '';
  productFields.name.value = '';
  productFields.category.value = '';
  productFields.price.value = '';
  productFields.badge.value = '';
  productFields.imageUrl.value = null; 
  productFields.color.value = '';
  productFields.description.value = '';
  saveProductBtn.textContent = 'حفظ المنتج';
}

function createProductRow(id, data) {
  return `
    <tr>
      <td>${data.name}</td>
      <td>${data.category}</td>
      <td>${data.price} ر.س</td>
      <td><span class="small-tag">${data.badge || 'بدون علامة'}</span></td>
      <td style="display:flex; gap:.5rem; justify-content:flex-end;">
        <button type="button" class="edit" data-id="${id}">تعديل</button>
        <button type="button" class="delete" data-id="${id}">حذف</button>
      </td>
    </tr>
  `;
}

async function listenProducts() {
  const q = query(productsRef, orderBy('createdAt', 'desc'));
  onSnapshot(q, snapshot => {
    if (!productTableContainer) return;
    productTableContainer.innerHTML = '';
    if (snapshot.empty) {
      if (adminEmpty) adminEmpty.style.display = 'block';
      return;
    }
    if (adminEmpty) adminEmpty.style.display = 'none';

    const table = document.createElement('table');
    table.className = 'admin-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>المنتج</th>
          <th>التصنيف</th>
          <th>السعر</th>
          <th>حالة</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      tbody.insertAdjacentHTML('beforeend', createProductRow(docSnap.id, data));
    });

    productTableContainer.appendChild(table);
    bindProductActions();
  }, err => {
    console.error('Firestore listen error', err);
  });
}

function bindProductActions() {
  productTableContainer.querySelectorAll('button.edit').forEach(btn => {
    btn.addEventListener('click', () => loadProductToForm(btn.dataset.id));
  });
  productTableContainer.querySelectorAll('button.delete').forEach(btn => {
    btn.addEventListener('click', () => removeProduct(btn.dataset.id));
  });
}

async function loadProductToForm(id) {
  const docRef = doc(db, 'products', id);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const data = snap.data();
    productFields.id.value = id;
    productFields.name.value = data.name || '';
    productFields.category.value = data.category || '';
    productFields.price.value = data.price || '';
    productFields.badge.value = data.badge || '';
    productFields.imageUrl.value = null; 
    productFields.color.value = data.color || '';
    productFields.description.value = data.description || '';
    saveProductBtn.textContent = 'تحديث المنتج';
  } catch (err) {
    console.error(err);
  }
}

async function removeProduct(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    console.error(err);
  }
}

async function saveProduct() {
  const name = productFields.name.value.trim();
  const category = productFields.category.value.trim();
  const price = Number(productFields.price.value);
  const badge = productFields.badge.value.trim();
  const color = productFields.color.value.trim();
  const description = productFields.description.value.trim();
  
  const imageFile = productFields.imageUrl && productFields.imageUrl.files ? productFields.imageUrl.files[0] : null; 

  if (!name || !category || !price) {
    alert('يرجى تعبئة الاسم، التصنيف، والسعر.');
    return;
  }

  if (!productFields.id.value && !imageFile) {
    alert('يرجى اختيار صورة للمنتج أولاً.');
    return;
  }

  try {
    let finalImageUrl = "";

    // استخدام الدالة الجديدة لتقليل الحجم والضغط فوراً قبل الرفع
    if (imageFile) {
      finalImageUrl = await compressAndConvertToBase64(imageFile);
    }

    const payload = {
      name,
      category,
      price,
      badge,
      color,
      description,
      updatedAt: serverTimestamp(),
    };

    if (finalImageUrl) {
      payload.imageUrl = finalImageUrl;
    }

    if (productFields.id.value) {
      const docRef = doc(db, 'products', productFields.id.value);
      await updateDoc(docRef, payload);
      alert('تم تحديث المنتج بنجاح');
    } else {
      await addDoc(productsRef, { ...payload, imageUrl: finalImageUrl, createdAt: serverTimestamp() });
      alert('تم إضافة المنتج بنجاح');
    }
    
    resetProductForm();
  } catch (err) {
    console.error("Error saving product: ", err);
    alert('حدث خطأ أثناء حفظ البيانات. تأكد من حجم الحقول.');
  }
}

async function initAdmin() {
  if (!logoutBtn) return;
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    listenProducts();
  });
}

if (saveProductBtn) {
  saveProductBtn.addEventListener('click', saveProduct);
}
if (clearFormBtn) {
  clearFormBtn.addEventListener('click', resetProductForm);
}
if (productTableContainer) {
  initAdmin();
}