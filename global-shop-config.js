async function applyGlobalConfig() {
    try {
        const response = await fetch('./shop-config.json?t=' + Date.now());
        const config = await response.json();
        
        // 1. Update all elements with class 'shop-name'
        document.querySelectorAll('.shop-name').forEach(el => {
            el.textContent = config.shopName;
        });

        // 2. Dynamic Page Title
        // Strategy: Look for a specific meta tag, a data attribute, or just use an <h1>
        const pageTitleTag = document.querySelector('meta[name="page-title"]')?.content;
        const bodyAttr = document.body.getAttribute('data-page');
        
        let titleSuffix = pageTitleTag || bodyAttr || "";
        
        document.title = titleSuffix ? `${config.shopName} - ${titleSuffix}` : config.shopName;

        // 3. Update specific IDs only if they exist on the page
        const mappings = {
            'shop-address': config.address,
            'shop-phone': config.phone,
            'shop-email': config.email,
            'shop-tax': config.taxCode
        };

        for (const [id, value] of Object.entries(mappings)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    } catch (error) {
        console.error("Global Config Error:", error);
    }
}

document.addEventListener("DOMContentLoaded", applyGlobalConfig);

