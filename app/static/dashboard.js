// View State Management
const views = {
    catalog: { title: 'Product Catalog', subtitle: 'Manage and optimize your store inventory.' },
    generate: { title: 'AI Listing Generator', subtitle: 'Harness multimodal AI to create high-converting listings.' },
    validate: { title: 'Quality Validator', subtitle: 'Ensure your listings meet marketplace and SEO standards.' },
    intelligence: { title: 'Retail Intelligence', subtitle: 'Monitor performance and detect sales anomalies.' }
};

function switchView(viewId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewId);
    });

    // Update visibility of sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.toggle('active', section.id === `${viewId}-view`);
    });

    // Update header text
    const viewData = views[viewId];
    if (viewData) {
        document.getElementById('view-title').innerText = viewData.title;
        document.getElementById('view-subtitle').innerText = viewData.subtitle;
    }

    // Refresh catalog if switching to catalog
    if (viewId === 'catalog') {
        fetchProducts();
    }

    // Re-initialize icons for newly shown content
    lucide.createIcons();
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
                        <div style="color: var(--text-muted); font-size: 0.8rem;">ID: ${p.id}</div>
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
        lucide.createIcons();
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
            lucide.createIcons();
            logIndex++;
        }
    }, 800);

    const formData = new FormData();
    formData.append('product_name', prodName);
    formData.append('description', document.getElementById('prodDesc').value);
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
        `;
        lucide.createIcons();
    } catch (err) {
        clearInterval(logInterval);
        resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// Listing Validation Handler
document.getElementById('validateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultDiv = document.getElementById('validateResult');
    const outputArea = document.getElementById('validation-output');

    outputArea.style.display = 'block';
    resultDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i data-lucide="shield" class="animate-spin"></i><p>Scanning...</p></div>';
    lucide.createIcons();

    const formData = new FormData();
    formData.append('title', document.getElementById('valTitle').value);
    formData.append('description', document.getElementById('valDesc').value);
    formData.append('image', document.getElementById('valImage').files[0]);

    try {
        const response = await fetch('/api/v1/validate/listing', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        const scoreColor = data.overall_score > 80 ? 'status-success' : (data.overall_score > 50 ? 'status-warning' : 'status-danger');

        resultDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; font-weight: 800; color: white;">${data.overall_score}<span style="font-size: 1rem; opacity: 0.5;">/100</span></div>
                <div class="status-badge ${scoreColor}" style="display: inline-block;">Quality Index</div>
            </div>

            ${document.getElementById('valImage').files[0] ? `
                <div style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); width: fit-content; margin-left: auto; margin-right: auto;">
                    <img src="${URL.createObjectURL(document.getElementById('valImage').files[0])}" style="width: 140px; height: 110px; object-fit: cover; display: block;">
                </div>
            ` : ''}
            
            <div class="mb-4">
                <h5 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <i data-lucide="image" style="width: 18px;"></i> Image Analysis
                </h5>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Detected Resolution: ${data.image_analysis.resolution}</p>
                <ul style="font-size: 0.85rem; color: var(--accent-danger); padding-left: 1.2rem;">
                    ${data.image_analysis.issues.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>

            <div>
                <h5 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <i data-lucide="file-text" style="width: 18px;"></i> Content Analysis
                </h5>
                <ul style="font-size: 0.85rem; color: var(--accent-warning); padding-left: 1.2rem;">
                    ${data.seo_analysis.issues.map(i => `<li>${i}</li>`).join('')}
                </ul>
                ${data.seo_analysis.issues.length === 0 ? '<p style="color: var(--accent-success); font-size: 0.85rem;">All content checks passed.</p>' : ''}
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
});

// Anomaly Detection Handler
document.getElementById('btnCheckAnomalies').addEventListener('click', async () => {
    const prodId = document.getElementById('prodId').value || 1;
    const resultDiv = document.getElementById('intelligenceResult');
    resultDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i data-lucide="activity" class="animate-spin"></i><p>Detecting Patterns...</p></div>';
    lucide.createIcons();

    try {
        const response = await fetch(`/api/v1/intelligence/anomalies/${prodId}`);
        const data = await response.json();

        if (data.anomalies_data.status === "insufficient_data") {
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
                                    <th style="padding: 1rem;">Date</th>
                                    <th style="padding: 1rem;">Type</th>
                                    <th style="padding: 1rem;">Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.anomalies_data.anomalies.map(a => `
                                    <tr style="border-top: 1px solid var(--glass-border);">
                                        <td style="padding: 1rem;">${new Date(a.date).toLocaleDateString()}</td>
                                        <td style="padding: 1rem;">
                                            <span class="status-badge ${a.type === 'drop' ? 'status-danger' : 'status-success'}">
                                                ${a.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style="padding: 1rem;">${a.value}</td>
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
        lucide.createIcons();
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
        lucide.createIcons();

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

// Initial Load
function init() {
    fetchProducts();
    setupImagePreview('prodImage', 'prodImagePreview');
    setupImagePreview('valImage', 'valImagePreview');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
