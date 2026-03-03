// View State Management
const views = {
    catalog: { title: 'Product Catalog', subtitle: 'Manage and optimize your store inventory.' },
    generate: { title: 'AI Listing Generator', subtitle: 'Harness multimodal AI to create human-centric listings.' },
    intelligence: { title: 'Retail Intelligence', subtitle: 'Monitor performance and identify sales trends.' }
};

// Helper to safely refresh icons
function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    } else {
        console.warn('Lucide icons library not loaded yet.');
    }
}

// Premium Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        success: 'check-circle-2',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    toast.innerHTML = `
        <i data-lucide="${iconMap[type]}" style="width: 20px; height: 20px;"></i>
        <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
    `;

    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

let modalResolver = null;
function confirmAction(title, body) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        modal.classList.add('active');
        modalResolver = resolve;

        const confirmBtn = document.getElementById('modal-confirm-btn');
        confirmBtn.onclick = () => {
            modal.classList.remove('active');
            resolve(true);
        };
    });
}

function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
    if (modalResolver) modalResolver(false);
}

// App Entry Logic
function enterApp() {
    const landing = document.getElementById('landing-page');
    landing.classList.add('exit');
    setTimeout(() => {
        landing.style.display = 'none';
        // Logic to refresh icons in dashboard once visible
        refreshIcons();
    }, 600);
}

function switchView(viewId) {
    // ... (rest of existing logic)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewId);
    });

    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.toggle('active', section.id === `${viewId}-view`);
    });

    const clearBtn = document.getElementById('btnClearAll');
    if (clearBtn) {
        clearBtn.style.display = viewId === 'catalog' ? 'flex' : 'none';
    }

    const viewData = views[viewId];
    if (viewData) {
        document.getElementById('view-title').innerText = viewData.title;
        document.getElementById('view-subtitle').innerText = viewData.subtitle;
    }

    if (viewId === 'catalog') {
        fetchProducts();
    }

    refreshIcons();
}

async function deleteProduct(productId) {
    if (!await confirmAction('Delete Product', 'Are you sure you want to delete this product? This will also remove its listings and sales history.')) return;

    try {
        const response = await fetch(`/api/v1/products/${productId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showToast('Product deleted from inventory.', 'success');
            fetchProducts();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (err) {
        showToast('Failed to delete product.', 'error');
    }
}

async function clearAllData() {
    if (!await confirmAction('Clear All Data', 'WARNING: This will delete ALL products, sales data, and listings. This action cannot be undone. Proceed?')) return;

    try {
        const response = await fetch('/api/v1/products/clear/all', { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            showToast('Database wiped successfully.', 'success');
            fetchProducts();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (err) {
        showToast('Failed to clear database.', 'error');
    }
}

// Navigation Event Listeners
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(link.dataset.view);
    });
});

// Fetch and Render Products
async function fetchProducts() {
    const listDiv = document.getElementById('product-list');
    try {
        const response = await fetch('/api/v1/products/');
        const products = await response.json();

        if (products.length === 0) {
            listDiv.innerHTML = `
                <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                    <i data-lucide="package-search" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No products found. Create your first listing to see it here!</p>
                </div>
            `;
        } else {
            listDiv.innerHTML = products.map(p => `
                <div class="glass-card listing-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <span class="status-badge status-success">Active</span>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="color: var(--text-muted); font-size: 0.8rem;">ID: ${p.id}</div>
                            <button class="btn-icon-danger" onclick="deleteProduct(${p.id})" title="Delete Product" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0; display: flex;">
                                <i data-lucide="trash" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    <h4 style="margin-bottom: 0.5rem;">${p.name}</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${p.description || 'No description provided.'}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--glass-border); pt-1">
                        <div style="font-weight: 700; font-size: 1.1rem; color: #818cf8;">$${p.price.toFixed(2)}</div>
                        <button class="btn-premium" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="checkSpecificAnomaly(${p.id})">
                            <i data-lucide="activity" style="width: 14px; height: 14px;"></i> Analyze
                        </button>
                    </div>
                </div>
            `).join('');
        }
        refreshIcons();
    } catch (err) {
        listDiv.innerHTML = `<div class="alert alert-danger">Failed to load catalog: ${err.message}</div>`;
    }
}

function checkSpecificAnomaly(id) {
    document.getElementById('prodId').value = id;
    switchView('intelligence');
    document.getElementById('btnCheckAnomalies').click();
}

// Content Generation Handler
document.getElementById('generateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultDiv = document.getElementById('generateResult');
    const outputArea = document.getElementById('ai-output');
    const prodName = document.getElementById('prodName').value;

    outputArea.style.display = 'block';

    // Agent Intelligence Animation
    const agentLogs = [
        "Initializing Listing Intelligence Agent...",
        `Analyzing market fit for "${prodName}"...`,
        "Researching competitor SEO patterns...",
        "Drafting benefit-driven architecture...",
        "Optimizing for semantic search intent...",
        "Refining listing quality and health score..."
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
        if (logIndex < agentLogs.length) {
            resultDiv.innerHTML = `
                <div style="padding: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <i data-lucide="bot" class="animate-pulse" style="width: 32px; height: 32px; color: var(--primary-color);"></i>
                        <h4 style="margin: 0;">Agent Intelligence Active</h4>
                    </div>
                    <div id="agent-thinking-logs" style="font-family: monospace; font-size: 0.85rem; color: #818cf8; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 2px solid var(--primary-color);">
                        ${agentLogs.slice(0, logIndex + 1).map(log => `<div>> ${log}</div>`).join('')}
                        <div class="animate-pulse">> _</div>
                    </div>
                </div>
            `;
            refreshIcons();
            logIndex++;
        }
    }, 800);

    const formData = new FormData();
    formData.append('product_name', prodName);
    formData.append('description', document.getElementById('prodDesc').value);
    formData.append('product_sku', document.getElementById('prodSku').value);
    const fileInput = document.getElementById('prodImage');
    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch('/api/v1/generate', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        clearInterval(logInterval);

        const imageFile = document.getElementById('prodImage').files[0];
        const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

        resultDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; animation: fadeIn 0.5s ease;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="sparkles" style="color: var(--accent-warning); width: 20px;"></i>
                    <h4 style="margin: 0;">Optimized Listing Architecture</h4>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    ${data.history_factored ? `
                        <div class="status-badge" style="background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3);">
                            <i data-lucide="trending-up" style="width: 12px; display: inline; margin-right: 4px;"></i>History Factored
                        </div>
                    ` : ''}
                    <div class="status-badge" style="background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.3);">
                        <i data-lucide="user-pen" style="width: 12px; display: inline; margin-right: 4px;"></i>${data.persona || 'Expert Copy'}
                    </div>
                </div>
            </div>

            ${imageUrl ? `
                <div style="margin-bottom: 1.5rem; border-radius: 12px; overflow: hidden; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); width: fit-content;">
                    <img src="${imageUrl}" style="width: 150px; height: 120px; object-fit: cover; display: block;">
                </div>
            ` : ''}

            <div style="margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="type" style="width: 14px;"></i> SEO Optimized Title
                </label>
                <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.05); font-weight: 600; border-color: rgba(99, 102, 241, 0.3);">${data.title}</div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="align-left" style="width: 14px;"></i> Persuasive Storytelling
                </label>
                <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); padding: 0.5rem;">${data.description}</div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="list-check" style="width: 14px;"></i> High-Impact Benefits
                </label>
                <ul style="padding-left: 1.2rem; color: var(--text-main); font-size: 0.9rem;">
                    ${(data.bullets || []).map(b => `<li style="margin-bottom: 0.5rem; list-style: none; display: flex; gap: 0.5rem;">
                        <i data-lucide="check-circle-2" style="width: 16px; min-width: 16px; color: var(--accent-success); margin-top: 2px;"></i>
                        <span>${b}</span>
                    </li>`).join('')}
                </ul>
            </div>

            <div class="keywords-container">
                <label style="display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="tag" style="width: 14px;"></i> SEO Semantic Target
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem;">
                    ${(data.keywords || []).map(k => `<span class="status-badge" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.2);">${k}</span>`).join('')}
                </div>
            </div>

            ${data.mode ? `
                <div style="margin-top: 1.5rem; padding: 0.75rem; border-radius: 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="alert-triangle" style="width: 14px; color: var(--accent-warning);"></i>
                    <span style="color: var(--accent-warning);">${data.mode}</span>
                </div>
            ` : ''}

            <div style="margin-top: 2rem; border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                <button class="btn-premium w-100" id="btnSaveToCatalog">
                    <i data-lucide="folder-plus"></i> Add to Catalog
                </button>
                <div id="saveStatus" style="margin-top: 0.5rem; font-size: 0.85rem; text-align: center; display: none;"></div>
            </div>
        `;

        // Add listener for the new save button
        document.getElementById('btnSaveToCatalog').addEventListener('click', async () => {
            const saveBtn = document.getElementById('btnSaveToCatalog');
            const saveStatus = document.getElementById('saveStatus');
            const price = document.getElementById('prodPrice').value;
            const sku = document.getElementById('prodSku').value;

            saveStatus.style.display = 'block';
            saveStatus.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 12px;"></i> Saving...';
            saveBtn.disabled = true;
            refreshIcons();

            try {
                const saveResponse = await fetch('/api/v1/products/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.title,
                        description: data.description,
                        price: parseFloat(price),
                        sku: sku || null,
                        category: data.persona || 'AI Generated'
                    })
                });

                const saveResult = await saveResponse.json();
                if (saveResponse.ok) {
                    saveStatus.innerHTML = '<span style="color: var(--accent-success);">✅ Product added to catalog!</span>';
                    fetchProducts(); // Refresh catalog
                } else {
                    saveStatus.innerHTML = `<span style="color: var(--accent-danger);">❌ Error: ${saveResult.detail || 'Failed to save'}</span>`;
                    saveBtn.disabled = false;
                }
            } catch (err) {
                saveStatus.innerHTML = `<span style="color: var(--accent-danger);">❌ Error: ${err.message}</span>`;
                saveBtn.disabled = false;
            }
            refreshIcons();
        });
        refreshIcons();
    } catch (err) {
        clearInterval(logInterval);
        resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// Validate Terms Only (New Button in AI Generator)
const btnValidateOnly = document.getElementById('btnValidateOnly');
if (btnValidateOnly) {
    btnValidateOnly.addEventListener('click', async () => {
        const title = document.getElementById('prodName').value;
        const desc = document.getElementById('prodDesc').value;
        const imgInput = document.getElementById('prodImage');
        const resultDiv = document.getElementById('generateResult');
        const outputArea = document.getElementById('ai-output');

        if (!title || !desc) {
            showToast('Please provide at least a Name and Description to validate.', 'warning');
            return;
        }

        outputArea.style.display = 'block';
        resultDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i data-lucide="shield" class="animate-spin" style="width: 32px; height: 32px; color: #f59e0b;"></i><p style="margin-top: 1rem; color: #f59e0b;">Scanning compliance terms...</p></div>';
        refreshIcons();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', desc);
        if (imgInput.files[0]) {
            formData.append('image', imgInput.files[0]);
        }

        try {
            const response = await fetch('/api/v1/validate/listing', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            resultDiv.innerHTML = `
                <div style="padding: 1.5rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--glass-border); animation: fadeIn 0.4s ease;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: #f59e0b;">
                        <i data-lucide="shield-check"></i>
                        <h4 style="margin: 0;">Compatibility Scan Result</h4>
                    </div>
                    
                    <div style="margin-bottom: 2rem; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: white;">${Math.round(data.overall_score)}<span style="font-size: 1rem; opacity: 0.5;">/100</span></div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Confidence Inventory</div>
                    </div>

                    <div style="display: grid; gap: 1rem;">
                        <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.03);">
                            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                                <i data-lucide="file-text" style="width: 14px; color: #818cf8;"></i> Compliance Status
                            </div>
                            <div style="font-size: 0.8rem; color: ${data.seo_analysis.health_score > 80 ? 'var(--accent-success)' : '#f59e0b'};">
                                ${data.seo_analysis.health_score > 80 ? '✅ Terms are safe for all platforms.' : '⚠ Restricted terms detected in description.'}
                            </div>
                            <ul style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; padding-left: 1rem;">
                                ${data.seo_analysis.issues.map(i => `<li>${i}</li>`).join('')}
                            </ul>
                        </div>
                        
                        ${data.image_analysis ? `
                        <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.03);">
                            <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                                <i data-lucide="image" style="width: 14px; color: #818cf8;"></i> Image Quality
                            </div>
                            <div style="font-size: 0.8rem;">
                                Score: ${data.image_analysis.score}/100 - ${data.image_analysis.details}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px; border-left: 2px solid #f59e0b;">
                        <i data-lucide="lightbulb" style="width: 14px; display: inline; margin-right: 4px; color: #f59e0b;"></i>
                        <strong>Insight:</strong> Click "Generate AI Listing" to automatically fix these issues and optimize for past sales trends.
                    </div>
                </div>
            `;
            refreshIcons();
        } catch (err) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Scan Failed: ${err.message}</div>`;
        }
    });
}

// Anomaly Detection Handler
document.getElementById('btnCheckAnomalies').addEventListener('click', async () => {
    const prodId = document.getElementById('prodId').value || 1;
    const resultDiv = document.getElementById('intelligenceResult');
    resultDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i data-lucide="activity" class="animate-spin"></i><p>Detecting Patterns...</p></div>';
    refreshIcons();

    try {
        const response = await fetch(`/api/v1/intelligence/anomalies/${prodId}`);
        const data = await response.json();

        if (data.anomalies_data.status === "product_not_found") {
            anomaliesHtml = `
                <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 2rem; border: 1px solid rgba(239, 68, 68, 0.2);">
                    <h5 style="color: #ef4444; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="alert-circle" style="width: 18px;"></i> Product Not Found
                    </h5>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">No product matches the ID or SKU provided. Ensure you've imported your catalog or sales history first.</p>
                </div>
            `;
        } else if (data.anomalies_data.status === "insufficient_data") {
            anomaliesHtml = `
                <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 2rem; border: 1px solid rgba(245, 158, 11, 0.2);">
                    <h5 style="color: #f59e0b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="info" style="width: 18px;"></i> Insufficient Sales Data
                    </h5>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Anomaly detection requires at least 5 sales entries for this product. Use the import tool above to add more data.</p>
                </div>
            `;
        } else if (data.anomalies_data.anomalies && data.anomalies_data.anomalies.length > 0) {
            anomaliesHtml = `
                <div class="mb-4">
                    <h5 class="mb-3">Detected Anomalies</h5>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; color: var(--text-muted); font-size: 0.8rem;">
                                    <th style="padding: 1rem;">Transaction Date</th>
                                    <th style="padding: 1rem;">Trend Observation</th>
                                    <th style="padding: 1rem;">Quantity Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.anomalies_data.anomalies.map(a => `
                                    <tr style="border-top: 1px solid var(--glass-border);">
                                        <td style="padding: 1rem;">${new Date(a.date).toLocaleDateString()}</td>
                                        <td style="padding: 1rem;">
                                            <span class="status-badge ${a.type === 'drop' ? 'status-danger' : 'status-success'}" style="font-size: 0.7rem; padding: 0.2rem 0.6rem;">
                                                <i data-lucide="${a.type === 'drop' ? 'trending-down' : 'trending-up'}" style="width: 10px; display: inline; margin-right: 4px;"></i>
                                                ${a.type === 'drop' ? 'Low Demand' : 'High Sale Surge'}
                                            </span>
                                        </td>
                                        <td style="padding: 1rem; font-weight: 600;">${a.value} Units</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        resultDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 2rem;">
                <div>
                    ${anomaliesHtml}
                </div>
                <div>
                    <div class="glass-card" style="padding: 1.5rem; border-color: rgba(245, 158, 11, 0.3);">
                        <h5 style="display: flex; align-items: center; gap: 0.5rem; color: #f59e0b; margin-bottom: 1rem;">
                            <i data-lucide="lightbulb" style="width: 18px;"></i> AI Insights
                        </h5>
                        <ul style="font-size: 0.9rem; padding-left: 1rem; color: var(--text-main);">
                            ${data.recommendations.map(r => `<li style="margin-bottom: 1rem; line-height: 1.4;">${r}</li>`).join('')}
                        </ul>
                        ${data.recommendations.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.85rem;">Collecting more data to provide insights.</p>' : ''}
                    </div>
                </div>
            </div>
        `;
        refreshIcons();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// Sales Data Ingestion Handler
const salesForm = document.getElementById('salesIngestForm');
if (salesForm) {
    salesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusDiv = document.getElementById('ingestStatus');
        const fileInput = document.getElementById('salesCsv');

        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Processing...';
        refreshIcons();

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('/api/v1/ingest/csv', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.errors === 0) {
                statusDiv.innerHTML = `<span style="color: var(--accent-success);">✅ Successfully imported ${data.success} sales records.</span>`;
                fileInput.value = '';
                // Trigger analysis if a prod ID is present
                if (document.getElementById('prodId').value) {
                    document.getElementById('btnCheckAnomalies').click();
                }
            } else {
                statusDiv.innerHTML = `<span style="color: var(--accent-warning);">⚠ Imported ${data.success} records with ${data.errors} errors.</span>`;
            }
        } catch (err) {
            statusDiv.innerHTML = `<span style="color: var(--accent-danger);">❌ Error: ${err.message}</span>`;
        }
    });
}

// Image Preview Helper
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) return;

    const updatePreview = () => {
        const file = input.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            preview.innerHTML = `<img src="${url}" alt="Preview" style="width: 100%; display: block;">`;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    };

    input.addEventListener('change', updatePreview);

    // Also check if there's already a file (e.g. on page reload/back button)
    if (input.files && input.files[0]) {
        updatePreview();
    }
}

// Custom Format Management
let currentDetectedMapping = null;

function toggleFormatForm() {
    const container = document.getElementById('formatFormContainer');
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        document.getElementById('customHeaderForm').reset();
        document.getElementById('mappingPreview').style.display = 'none';
        document.getElementById('btnSaveMapping').disabled = true;
    }
}

async function fetchMappings() {
    const listDiv = document.getElementById('mappingList');
    try {
        const response = await fetch('/api/v1/config/mappings');
        const mappings = await response.json();

        if (mappings.length === 0) {
            listDiv.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); width: 100%; text-align: center; padding: 1rem;">No custom formats registered. Using standard heuristics.</div>`;
        } else {
            listDiv.innerHTML = mappings.map(m => `
                <div class="status-badge" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem;">
                    <i data-lucide="file-code" style="width: 12px; color: var(--primary-color);"></i>
                    <span>${m.format_name}</span>
                </div>
            `).join('');
        }
        refreshIcons();
    } catch (err) {
        console.error('Failed to fetch mappings:', err);
    }
}

// Live Header Analysis
document.getElementById('rawHeaderRow').addEventListener('input', debounce(async (e) => {
    const header = e.target.value.trim();
    if (header.length < 5) {
        document.getElementById('mappingPreview').style.display = 'none';
        return;
    }

    try {
        const response = await fetch('/api/v1/config/analyze-headers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ header })
        });
        const mapping = await response.json();

        const previewGrid = document.getElementById('previewGrid');
        const previewPanel = document.getElementById('mappingPreview');

        currentDetectedMapping = mapping;

        const fields = [
            { id: 'sku', label: 'Product ID / SKU' },
            { id: 'date', label: 'Transaction Date' },
            { id: 'qty', label: 'Quantity' },
            { id: 'price', label: 'Price / Sales' },
            { id: 'name', label: 'Product Name' }
        ];

        let html = '';
        let foundAll = true;

        fields.forEach(f => {
            let val = mapping[f.id];

            // Flexibly handle price/revenue detection
            if (f.id === 'price') {
                val = mapping.unit_price || mapping.total_revenue;
            }

            const found = !!val;
            if (f.id !== 'name' && !found) foundAll = false;

            html += `
                <div style="display: flex; justify-content: space-between; padding: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="opacity: 0.6;">${f.label}:</span>
                    <span style="color: ${found ? '#10b981' : '#f59e0b'}; font-weight: 500;">
                        ${val || (found ? '' : 'Not Detected')}
                    </span>
                </div>
            `;
        });

        previewGrid.innerHTML = html;
        previewPanel.style.display = 'block';
        document.getElementById('btnSaveMapping').disabled = !foundAll;

    } catch (err) {
        console.error('Analysis failed', err);
    }
}, 500));

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const headerForm = document.getElementById('customHeaderForm');
if (headerForm) {
    headerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentDetectedMapping) return;

        const body = {
            format_name: document.getElementById('mapName').value,
            sku_col: currentDetectedMapping.sku,
            date_col: currentDetectedMapping.date,
            qty_col: currentDetectedMapping.qty,
            price_col: currentDetectedMapping.unit_price || currentDetectedMapping.total_revenue,
            name_col: currentDetectedMapping.name || null
        };

        try {
            const response = await fetch('/api/v1/config/mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                headerForm.reset();
                toggleFormatForm();
                showToast('Format saved successfully.', 'success');
                fetchMappings();
            } else {
                const err = await response.json();
                showToast('Error saving format: ' + (err.detail || 'Check input'), 'error');
            }
        } catch (err) {
            showToast('Failed to save configuration.', 'error');
        }
    });
}

// Initial Load
function init() {
    switchView('catalog');
    setupImagePreview('prodImage', 'prodImagePreview');
    setupImagePreview('valImage', 'valImagePreview');
    fetchMappings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
