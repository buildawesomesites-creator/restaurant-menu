import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let categories = [];
let allProducts = {};
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let isInitialized = false;
let currentUid = null;

cart = (Array.isArray(cart) ? cart : [])
    .filter(item => item && item.id)
    .map(item => ({ ...item, qty: Number(item.qty) || 1 }));

saveCart();

window.openCart = openCart;
window.closeCart = closeCart;
window.generateCheckoutQR = generateCheckoutQR;
window.updateGridQty = updateGridQty;

onAuthStateChanged(auth, (user) => {
    currentUid = user ? user.uid : null;
});

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(amount) + ' đ';
}

function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => container.removeChild(toast), 400);
    }, 3000);
}

async function init() {
    if (isInitialized) return;
    const select = document.getElementById("category-select");
    const main = document.getElementById("main-content");
    const search = document.getElementById("search-input");
    
    if (!select || !main || !search) {
        setTimeout(init, 100);
        return;
    }

    isInitialized = true;
    try {
        const res = await fetch("./products/categories.json?t=" + Date.now());
        const rawCategories = await res.json();
        categories = [...new Set(rawCategories.map(c => c.toLowerCase()))];
        
        select.innerHTML = '<option value="">Select Category</option>';
        main.innerHTML = "";

        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat === "foryou" ? "FOR YOU" : cat.toUpperCase();
            select.appendChild(option);

            const section = document.createElement("div");
            section.className = "section";
            section.id = "sec-" + cat;
            section.innerHTML = `
                ${cat === "foryou" ? "" : `<div class="section-title">${cat.toUpperCase()}</div>`}
                <div id="grid-${cat}" class="${cat === "foryou" ? "grid-foryou" : "grid-standard"}"></div>
            `;
            main.appendChild(section);
        });

        select.addEventListener("change", (e) => {
            const target = document.getElementById("sec-" + e.target.value);
            if (target) target.scrollIntoView({ behavior: "smooth" });
        });

        search.addEventListener("input", (e) => filterProducts(e.target.value));
        await Promise.all(categories.map(loadCategory));
    } catch (err) { console.error("Init Error:", err); }
    updateCartCount();
}

async function loadCategory(cat) {
    try {
        const res = await fetch(`./products/${cat}.json?t=${Date.now()}`);
        if (!res.ok) return;
        allProducts[cat] = await res.json();
        renderCategoryGrid(cat);
    } catch (e) { console.error("Load Category Error:", e); }
}

function renderCategoryGrid(cat, filteredProds = null) {
    const grid = document.getElementById("grid-" + cat);
    if (!grid || !allProducts[cat]) return; 
    
    const products = filteredProds || allProducts[cat];
    grid.innerHTML = "";
    
    products.forEach(p => {
        const cartItem = cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.qty : 0;
        
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img src="${p.image}" alt="">
            <div class="product-info">
                <h3>${p.title}</h3>
                <p class="product-desc">${p.description || ''}</p>
                <div class="product-price">${formatCurrency(p.discountPrice || p.price)}</div>
            </div>
        `;
        
        const controls = document.createElement("div");
        if (p.stock <= 0) {
            controls.innerHTML = `<button disabled style="background:#ccc; border:none; border-radius:12px; width:42px; height:42px; font-weight:900;">X</button>`;
        } else if (qty > 0) {
            controls.className = "qty-controls";
            controls.innerHTML = `
                <button class="qty-btn" onclick="updateGridQty('${cat}','${p.id}',-1)" style="color:green; font-weight:900; font-size:20px;">-</button>
                <span class="qty-value" style="font-weight:900; font-size:20px; margin: 0 10px;">${qty}</span>
                <button class="qty-btn" onclick="updateGridQty('${cat}','${p.id}',1)" style="color:green; font-weight:900; font-size:20px;">+</button>
            `;
        } else {
            const addBtn = document.createElement("button");
            addBtn.className = "btn-add";
            addBtn.textContent = "+";
            addBtn.style.color = "green";
            addBtn.style.fontWeight = "900";
            addBtn.onclick = () => updateGridQty(cat, p.id, 1);
            controls.appendChild(addBtn);
        }
        card.appendChild(controls);
        grid.appendChild(card);
    });
}

function updateGridQty(cat, id, change) {
    if (!cat) {
        for (const c in allProducts) {
            if (allProducts[c].find(i => i.id === id)) { cat = c; break; }
        }
    }
    const prod = allProducts[cat]?.find(i => i.id === id);
    if (!prod) return;
    
    const existing = cart.find(i => i.id === id);
    if (change > 0) showToast("Added to cart");
    
    if (existing) {
        existing.qty += change;
        if (existing.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
            showToast("Removed from cart");
        }
    } else if (change > 0) {
        cart.push({ ...prod, qty: 1, price: prod.discountPrice || prod.price });
    }
    
    saveCart();
    renderCategoryGrid(cat);
    updateCartCount();
    if(document.getElementById("payment-modal").style.display === "flex") renderCart();
}

function filterProducts(query) {
    const q = query.toLowerCase();
    for (const cat in allProducts) {
        renderCategoryGrid(cat, allProducts[cat].filter(p => p.title.toLowerCase().includes(q)));
    }
}

function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }

function updateCartCount() { 
    const el = document.getElementById("cart-count");
    if(el) {
        el.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
        el.style.fontSize = "22px";
        el.style.fontWeight = "900";
        el.style.color = "#28a745";
    } 
}

function openCart() { document.getElementById("payment-modal").style.display = "flex"; renderCart(); }
function closeCart() { document.getElementById("payment-modal").style.display = "none"; }

function renderCart() {
    const list = document.getElementById("cart-items-list");
    const totalEl = document.getElementById("cart-total");
    if (!list) return;
    
    if (cart.length === 0) {
        list.innerHTML = "<p>Your cart is empty.</p>";
        if (totalEl) totalEl.innerHTML = "";
        document.getElementById("checkout-btn").style.display = "none";
        return;
    }
    
    let total = 0;
    list.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        return `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; font-weight:900;">
                <div>${item.title}</div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <button onclick="updateGridQty('','${item.id}', -1); renderCart();" style="color:green; border:none; background:none; font-size:24px; font-weight:900;">-</button>
                    <span style="font-size:20px;">${item.qty}</span>
                    <button onclick="updateGridQty('','${item.id}', 1); renderCart();" style="color:green; border:none; background:none; font-size:24px; font-weight:900;">+</button>
                    <span style="min-width:80px; text-align:right;">${formatCurrency(item.price * item.qty)}</span>
                </div>
            </div>`;
    }).join('');
    
    if (totalEl) {
        totalEl.innerHTML = `<div style="border-top:2px solid #eee; padding-top:10px; font-size:22px; font-weight:900; color:#28a745;">Total: ${formatCurrency(total)}</div>`;
    }
    document.getElementById("checkout-btn").style.display = "block";
}

function generateCheckoutQR() {
    if (!currentUid) {
        localStorage.setItem("redirectAfterLogin", "checkout.html");
        window.location.href = "login.html";
        return;
    }
    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    localStorage.setItem("pendingOrder", JSON.stringify({ total, orderId: "DH" + Date.now().toString().slice(-6), items: cart }));
    window.location.href = "checkout.html";
}

document.addEventListener("DOMContentLoaded", init);

