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

    outputArea.style.display = 'block';
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="sparkles" class="animate-spin" style="width: 32px; height: 32px; color: var(--primary-color);"></i>
            <p style="margin-top: 1rem;">Architecting your listing...</p>
        </div>
    `;
    lucide.createIcons();

    const formData = new FormData();
    formData.append('product_name', document.getElementById('prodName').value);
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
        const scoreColor = data.health_score > 80 ? 'status-success' : (data.health_score > 50 ? 'status-warning' : 'status-danger');

        resultDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h4 style="margin: 0;">Optimization Result</h4>
                <div class="status-badge ${scoreColor}">Health Score: ${data.health_score}</div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label>Suggested Title</label>
                <div class="glass-card" style="padding: 1rem; background: rgba(0,0,0,0.2); font-weight: 600;">${data.title}</div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label>Description</label>
                <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-muted);">${data.description}</div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label>Feature Bullets</label>
                <ul style="padding-left: 1.2rem; color: var(--text-main); font-size: 0.9rem;">
                    ${(data.bullets || []).map(b => `<li style="margin-bottom: 0.5rem;">${b}</li>`).join('')}
                </ul>
            </div>
            <div class="keywords-container">
                <label>Keywords</label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${(data.keywords || []).map(k => `<span class="status-badge" style="background: rgba(255,255,255,0.05);">${k}</span>`).join('')}
                </div>
            </div>
        `;
    } catch (err) {
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

        let anomaliesHtml = `
            <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                <h5 class="mb-3">Temporal Anomalies</h5>
                <p style="color: var(--text-muted); font-size: 0.85rem;">No significant patterns detected in the current time-frame.</p>
            </div>
        `;

        if (data.anomalies_data.anomalies && data.anomalies_data.anomalies.length > 0) {
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

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});
