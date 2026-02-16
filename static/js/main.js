// Mistake Tracker - Main JavaScript

// State
let mistakes = [];
let topics = [];
let currentFilters = { topic: '', mistake_type: '' };
let deleteTargetId = null;
let typeChart = null;
let topicChart = null;

// DOM Elements
const mistakesTable = document.getElementById('mistakes-tbody');
const noDataMessage = document.getElementById('no-data');
const mistakeCount = document.getElementById('mistake-count');
const filterTopic = document.getElementById('filter-topic');
const filterType = document.getElementById('filter-type');
const clearFiltersBtn = document.getElementById('clear-filters');
const toggleAnalyticsBtn = document.getElementById('toggle-analytics');
const analyticsSection = document.getElementById('analytics-section');
const addForm = document.getElementById('add-form');
const editForm = document.getElementById('edit-form');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Paste zones - Question
const pasteZone = document.getElementById('paste-zone');
const previewImage = document.getElementById('preview-image');
const clearImageBtn = document.getElementById('clear-image');
const newImageInput = document.getElementById('new-image');
const pasteHint = pasteZone.querySelector('.paste-hint');

const editPasteZone = document.getElementById('edit-paste-zone');
const editPreviewImage = document.getElementById('edit-preview-image');
const editClearImageBtn = document.getElementById('edit-clear-image');
const editImageInput = document.getElementById('edit-image');
const editPasteHint = editPasteZone.querySelector('.paste-hint');

// Paste zones - Solution
const solutionPasteZone = document.getElementById('solution-paste-zone');
const solutionPreviewImage = document.getElementById('solution-preview-image');
const clearSolutionImageBtn = document.getElementById('clear-solution-image');
const newSolutionImageInput = document.getElementById('new-solution-image');
const solutionPasteHint = solutionPasteZone.querySelector('.paste-hint');

const editSolutionPasteZone = document.getElementById('edit-solution-paste-zone');
const editSolutionPreviewImage = document.getElementById('edit-solution-preview-image');
const editClearSolutionImageBtn = document.getElementById('edit-clear-solution-image');
const editSolutionImageInput = document.getElementById('edit-solution-image');
const editSolutionPasteHint = editSolutionPasteZone.querySelector('.paste-hint');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMistakes();
    loadTopics();
    setupEventListeners();
    setupClipboardPaste();
    setupTabs();
});

// API Functions
async function loadMistakes() {
    const params = new URLSearchParams();
    if (currentFilters.topic) params.append('topic', currentFilters.topic);
    if (currentFilters.mistake_type) params.append('mistake_type', currentFilters.mistake_type);
    
    const response = await fetch(`/api/mistakes?${params}`);
    mistakes = await response.json();
    renderTable();
}

async function loadTopics() {
    const response = await fetch('/api/topics');
    topics = await response.json();
    renderTopicFilter();
}

async function loadAnalytics() {
    const response = await fetch('/api/analytics');
    const data = await response.json();
    renderAnalytics(data);
}

async function addMistake(data) {
    const response = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function updateMistake(id, data) {
    const response = await fetch(`/api/mistakes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function deleteMistake(id) {
    const response = await fetch(`/api/mistakes/${id}`, {
        method: 'DELETE'
    });
    return response.json();
}

// Render Functions
function renderTable() {
    mistakesTable.innerHTML = '';
    
    if (mistakes.length === 0) {
        noDataMessage.classList.remove('hidden');
        mistakeCount.textContent = '0';
        return;
    }
    
    noDataMessage.classList.add('hidden');
    mistakeCount.textContent = mistakes.length;
    
    mistakes.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(m.date_added)}</td>
            <td>${escapeHtml(m.topic)}</td>
            <td>${renderThumbnail(m.question_image, m.id, 'question')}</td>
            <td>${renderThumbnail(m.solution_image, m.id, 'solution')}</td>
            <td>${renderMistakeType(m.mistake_type)}</td>
            <td>${escapeHtml(m.why_happened)}</td>
            <td>${escapeHtml(m.how_to_avoid)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" data-id="${m.id}" title="Edit">&#9998;</button>
                    <button class="btn-icon btn-delete" data-id="${m.id}" title="Delete">&#128465;</button>
                </div>
            </td>
        `;
        mistakesTable.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.thumbnail').forEach(img => {
        img.addEventListener('click', () => openImageModal(img.dataset.src));
    });
}

function renderTopicFilter() {
    // Keep first option
    filterTopic.innerHTML = '<option value="">All Topics</option>';
    topics.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filterTopic.appendChild(opt);
    });
}

function renderThumbnail(imageData, id, type) {
    if (!imageData) {
        return '<span class="no-image">No image</span>';
    }
    return `<img src="${imageData}" class="thumbnail" data-src="${imageData}" alt="${type}">`;
}

function renderMistakeType(type) {
    const className = type.toLowerCase().replace(/[\/\s]/g, '-');
    return `<span class="mistake-type-badge ${className}">${escapeHtml(type)}</span>`;
}

function renderAnalytics(data) {
    document.getElementById('total-mistakes').textContent = data.total_mistakes;
    document.getElementById('most-common-type').textContent = data.most_common_type || '-';
    
    // Type distribution pie chart
    const typeCtx = document.getElementById('type-chart').getContext('2d');
    const typeLabels = Object.keys(data.type_distribution);
    const typeValues = Object.values(data.type_distribution);
    
    if (typeChart) typeChart.destroy();
    typeChart = new Chart(typeCtx, {
        type: 'pie',
        data: {
            labels: typeLabels,
            datasets: [{
                data: typeValues,
                backgroundColor: [
                    '#fef3c7', '#fee2e2', '#dbeafe', 
                    '#f3e8ff', '#fce7f3', '#d1fae5'
                ],
                borderColor: [
                    '#92400e', '#991b1b', '#1e40af',
                    '#6b21a8', '#9d174d', '#065f46'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 11 } }
                }
            }
        }
    });
    
    // Topic distribution bar chart
    const topicCtx = document.getElementById('topic-chart').getContext('2d');
    const topicLabels = Object.keys(data.topic_distribution);
    const topicValues = Object.values(data.topic_distribution);
    
    if (topicChart) topicChart.destroy();
    topicChart = new Chart(topicCtx, {
        type: 'bar',
        data: {
            labels: topicLabels,
            datasets: [{
                label: 'Mistakes',
                data: topicValues,
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Filters
    filterTopic.addEventListener('change', () => {
        currentFilters.topic = filterTopic.value;
        loadMistakes();
    });
    
    filterType.addEventListener('change', () => {
        currentFilters.mistake_type = filterType.value;
        loadMistakes();
    });
    
    clearFiltersBtn.addEventListener('click', () => {
        filterTopic.value = '';
        filterType.value = '';
        currentFilters = { topic: '', mistake_type: '' };
        loadMistakes();
    });
    
    // Analytics toggle
    toggleAnalyticsBtn.addEventListener('click', () => {
        analyticsSection.classList.toggle('hidden');
        if (!analyticsSection.classList.contains('hidden')) {
            toggleAnalyticsBtn.textContent = 'Hide Analytics';
            loadAnalytics();
        } else {
            toggleAnalyticsBtn.textContent = 'Show Analytics';
        }
    });
    
    // Add form
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            topic: document.getElementById('new-topic').value,
            mistake_type: document.getElementById('new-type').value,
            question_image: newImageInput.value,
            solution_image: newSolutionImageInput.value,
            why_happened: document.getElementById('new-why').value,
            how_to_avoid: document.getElementById('new-avoid').value
        };
        
        await addMistake(data);
        
        // Reset form
        addForm.reset();
        clearPastedImage();
        clearPastedSolutionImage();
        
        // Reload
        loadMistakes();
        loadTopics();
        if (!analyticsSection.classList.contains('hidden')) {
            loadAnalytics();
        }
        
        // Switch to mistakes tab to show the new entry
        switchTab('mistakes-tab');
    });
    
    // Edit form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const data = {
            topic: document.getElementById('edit-topic').value,
            mistake_type: document.getElementById('edit-type').value,
            question_image: editImageInput.value,
            solution_image: editSolutionImageInput.value,
            why_happened: document.getElementById('edit-why').value,
            how_to_avoid: document.getElementById('edit-avoid').value
        };
        
        await updateMistake(id, data);
        closeEditModal();
        loadMistakes();
        loadTopics();
        if (!analyticsSection.classList.contains('hidden')) {
            loadAnalytics();
        }
    });
    
    // Cancel edit
    document.getElementById('cancel-edit').addEventListener('click', closeEditModal);
    
    // Delete confirmation
    document.getElementById('confirm-delete').addEventListener('click', async () => {
        if (deleteTargetId) {
            await deleteMistake(deleteTargetId);
            deleteTargetId = null;
            closeDeleteModal();
            loadMistakes();
            loadTopics();
            if (!analyticsSection.classList.contains('hidden')) {
                loadAnalytics();
            }
        }
    });
    
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            deleteModal.classList.add('hidden');
            imageModal.classList.add('hidden');
        });
    });
    
    // Close modal on backdrop click
    [editModal, deleteModal, imageModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // Clear image buttons
    clearImageBtn.addEventListener('click', clearPastedImage);
    editClearImageBtn.addEventListener('click', clearEditPastedImage);
    clearSolutionImageBtn.addEventListener('click', clearPastedSolutionImage);
    editClearSolutionImageBtn.addEventListener('click', clearEditPastedSolutionImage);
}

// Clipboard Paste Handling
function setupClipboardPaste() {
    // Make paste zones focusable and add visual feedback
    pasteZone.setAttribute('tabindex', '0');
    editPasteZone.setAttribute('tabindex', '0');
    solutionPasteZone.setAttribute('tabindex', '0');
    editSolutionPasteZone.setAttribute('tabindex', '0');
    
    // Add form question paste zone
    pasteZone.addEventListener('click', () => {
        pasteZone.focus();
        pasteZone.classList.add('active');
    });
    
    pasteZone.addEventListener('focus', () => {
        pasteZone.classList.add('active');
        updatePasteHint(pasteZone, 'Ready to paste! Press Ctrl+V');
    });
    
    pasteZone.addEventListener('blur', () => {
        pasteZone.classList.remove('active');
        updatePasteHint(pasteZone, 'Click here and paste image (Ctrl+V)');
    });
    
    pasteZone.addEventListener('paste', (e) => handlePaste(e, 'question', false));
    pasteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pasteZone.classList.add('active');
        updatePasteHint(pasteZone, 'Drop image here');
    });
    pasteZone.addEventListener('dragleave', () => {
        pasteZone.classList.remove('active');
        updatePasteHint(pasteZone, 'Click here and paste image (Ctrl+V)');
    });
    pasteZone.addEventListener('drop', (e) => handleDrop(e, 'question', false));
    
    // Add form solution paste zone
    solutionPasteZone.addEventListener('click', () => {
        solutionPasteZone.focus();
        solutionPasteZone.classList.add('active');
    });
    
    solutionPasteZone.addEventListener('focus', () => {
        solutionPasteZone.classList.add('active');
        updatePasteHint(solutionPasteZone, 'Ready to paste! Press Ctrl+V');
    });
    
    solutionPasteZone.addEventListener('blur', () => {
        solutionPasteZone.classList.remove('active');
        updatePasteHint(solutionPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    
    solutionPasteZone.addEventListener('paste', (e) => handlePaste(e, 'solution', false));
    solutionPasteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        solutionPasteZone.classList.add('active');
        updatePasteHint(solutionPasteZone, 'Drop image here');
    });
    solutionPasteZone.addEventListener('dragleave', () => {
        solutionPasteZone.classList.remove('active');
        updatePasteHint(solutionPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    solutionPasteZone.addEventListener('drop', (e) => handleDrop(e, 'solution', false));
    
    // Edit form question paste zone
    editPasteZone.addEventListener('click', () => {
        editPasteZone.focus();
        editPasteZone.classList.add('active');
    });
    
    editPasteZone.addEventListener('focus', () => {
        editPasteZone.classList.add('active');
        updatePasteHint(editPasteZone, 'Ready to paste! Press Ctrl+V');
    });
    
    editPasteZone.addEventListener('blur', () => {
        editPasteZone.classList.remove('active');
        updatePasteHint(editPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    
    editPasteZone.addEventListener('paste', (e) => handlePaste(e, 'question', true));
    editPasteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        editPasteZone.classList.add('active');
        updatePasteHint(editPasteZone, 'Drop image here');
    });
    editPasteZone.addEventListener('dragleave', () => {
        editPasteZone.classList.remove('active');
        updatePasteHint(editPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    editPasteZone.addEventListener('drop', (e) => handleDrop(e, 'question', true));
    
    // Edit form solution paste zone
    editSolutionPasteZone.addEventListener('click', () => {
        editSolutionPasteZone.focus();
        editSolutionPasteZone.classList.add('active');
    });
    
    editSolutionPasteZone.addEventListener('focus', () => {
        editSolutionPasteZone.classList.add('active');
        updatePasteHint(editSolutionPasteZone, 'Ready to paste! Press Ctrl+V');
    });
    
    editSolutionPasteZone.addEventListener('blur', () => {
        editSolutionPasteZone.classList.remove('active');
        updatePasteHint(editSolutionPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    
    editSolutionPasteZone.addEventListener('paste', (e) => handlePaste(e, 'solution', true));
    editSolutionPasteZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        editSolutionPasteZone.classList.add('active');
        updatePasteHint(editSolutionPasteZone, 'Drop image here');
    });
    editSolutionPasteZone.addEventListener('dragleave', () => {
        editSolutionPasteZone.classList.remove('active');
        updatePasteHint(editSolutionPasteZone, 'Click here and paste image (Ctrl+V)');
    });
    editSolutionPasteZone.addEventListener('drop', (e) => handleDrop(e, 'solution', true));
    
    // Global paste handler as fallback when tab is active
    document.addEventListener('paste', (e) => {
        // Only handle if paste zone is focused or active tab is add-tab
        const addTabActive = document.getElementById('add-tab').classList.contains('active');
        if (addTabActive && document.activeElement === pasteZone) {
            handlePaste(e, 'question', false);
        }
    });
}

function updatePasteHint(zone, text) {
    const hint = zone.querySelector('.paste-hint');
    if (hint && !hint.classList.contains('hidden')) {
        hint.textContent = text;
    }
}

function getZoneByType(imageType, isEdit) {
    if (imageType === 'solution') {
        return isEdit ? editSolutionPasteZone : solutionPasteZone;
    } else {
        return isEdit ? editPasteZone : pasteZone;
    }
}

function handlePaste(e, imageType, isEdit) {
    e.preventDefault();
    e.stopPropagation();
    
    const zone = getZoneByType(imageType, isEdit);
    updatePasteHint(zone, 'Processing image...');
    
    // Try to get image from clipboard
    const clipboardData = e.clipboardData || e.originalEvent?.clipboardData || window.clipboardData;
    
    if (!clipboardData) {
        console.error('No clipboard data available');
        showPasteError(zone, 'Could not access clipboard');
        return;
    }
    
    let imageFound = false;
    
    // Method 1: Try clipboardData.items (modern browsers)
    if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    imageFound = true;
                    processImage(file, imageType, isEdit);
                    break;
                }
            }
        }
    }
    
    // Method 2: Try clipboardData.files (fallback)
    if (!imageFound && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            if (file.type.indexOf('image') !== -1) {
                imageFound = true;
                processImage(file, imageType, isEdit);
                break;
            }
        }
    }
    
    // Method 3: Try to get image from types array
    if (!imageFound && clipboardData.types) {
        for (let i = 0; i < clipboardData.types.length; i++) {
            if (clipboardData.types[i].indexOf('image') !== -1) {
                // Try getData
                const imageData = clipboardData.getData(clipboardData.types[i]);
                if (imageData) {
                    imageFound = true;
                    // If it's already a data URL
                    if (imageData.startsWith('data:image')) {
                        displayImage(imageData, imageType, isEdit);
                    }
                    break;
                }
            }
        }
    }
    
    if (!imageFound) {
        console.warn('No image found in clipboard');
        showPasteError(zone, 'No image found. Copy an image first!');
    }
}

function handleDrop(e, imageType, isEdit) {
    e.preventDefault();
    e.stopPropagation();
    
    const zone = getZoneByType(imageType, isEdit);
    zone.classList.remove('active');
    updatePasteHint(zone, 'Processing image...');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        let imageFound = false;
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                imageFound = true;
                processImage(files[i], imageType, isEdit);
                break;
            }
        }
        
        if (!imageFound) {
            showPasteError(zone, 'Please drop an image file');
        }
    } else {
        showPasteError(zone, 'No file dropped');
    }
}

function processImage(file, imageType, isEdit) {
    if (!file) {
        console.error('No file provided to processImage');
        return;
    }
    
    const zone = getZoneByType(imageType, isEdit);
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showPasteError(zone, 'Image too large. Max 10MB');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const base64 = e.target.result;
        displayImage(base64, imageType, isEdit);
    };
    
    reader.onerror = () => {
        console.error('FileReader error');
        showPasteError(zone, 'Failed to read image');
    };
    
    reader.readAsDataURL(file);
}

function displayImage(base64Data, imageType, isEdit) {
    if (imageType === 'solution') {
        if (isEdit) {
            editSolutionImageInput.value = base64Data;
            editSolutionPreviewImage.src = base64Data;
            editSolutionPreviewImage.classList.remove('hidden');
            editClearSolutionImageBtn.classList.remove('hidden');
            editSolutionPasteHint.classList.add('hidden');
        } else {
            newSolutionImageInput.value = base64Data;
            solutionPreviewImage.src = base64Data;
            solutionPreviewImage.classList.remove('hidden');
            clearSolutionImageBtn.classList.remove('hidden');
            solutionPasteHint.classList.add('hidden');
        }
    } else {
        if (isEdit) {
            editImageInput.value = base64Data;
            editPreviewImage.src = base64Data;
            editPreviewImage.classList.remove('hidden');
            editClearImageBtn.classList.remove('hidden');
            editPasteHint.classList.add('hidden');
        } else {
            newImageInput.value = base64Data;
            previewImage.src = base64Data;
            previewImage.classList.remove('hidden');
            clearImageBtn.classList.remove('hidden');
            pasteHint.classList.add('hidden');
        }
    }
}

function showPasteError(zone, message) {
    const hint = zone.querySelector('.paste-hint');
    if (hint) {
        const originalText = hint.textContent;
        hint.textContent = message;
        hint.style.color = '#dc2626';
        
        setTimeout(() => {
            hint.textContent = 'Click here and paste image (Ctrl+V)';
            hint.style.color = '';
        }, 3000);
    }
}

function clearPastedImage() {
    newImageInput.value = '';
    previewImage.src = '';
    previewImage.classList.add('hidden');
    clearImageBtn.classList.add('hidden');
    pasteHint.classList.remove('hidden');
}

function clearEditPastedImage() {
    editImageInput.value = '';
    editPreviewImage.src = '';
    editPreviewImage.classList.add('hidden');
    editClearImageBtn.classList.add('hidden');
    editPasteHint.classList.remove('hidden');
}

function clearPastedSolutionImage() {
    newSolutionImageInput.value = '';
    solutionPreviewImage.src = '';
    solutionPreviewImage.classList.add('hidden');
    clearSolutionImageBtn.classList.add('hidden');
    solutionPasteHint.classList.remove('hidden');
}

function clearEditPastedSolutionImage() {
    editSolutionImageInput.value = '';
    editSolutionPreviewImage.src = '';
    editSolutionPreviewImage.classList.add('hidden');
    editClearSolutionImageBtn.classList.add('hidden');
    editSolutionPasteHint.classList.remove('hidden');
}

// Modal Functions
function openEditModal(id) {
    const mistake = mistakes.find(m => m.id === id);
    if (!mistake) return;
    
    document.getElementById('edit-id').value = mistake.id;
    document.getElementById('edit-topic').value = mistake.topic;
    document.getElementById('edit-type').value = mistake.mistake_type;
    document.getElementById('edit-why').value = mistake.why_happened;
    document.getElementById('edit-avoid').value = mistake.how_to_avoid;
    
    // Handle question image
    if (mistake.question_image) {
        editImageInput.value = mistake.question_image;
        editPreviewImage.src = mistake.question_image;
        editPreviewImage.classList.remove('hidden');
        editClearImageBtn.classList.remove('hidden');
        editPasteHint.classList.add('hidden');
    } else {
        clearEditPastedImage();
    }
    
    // Handle solution image
    if (mistake.solution_image) {
        editSolutionImageInput.value = mistake.solution_image;
        editSolutionPreviewImage.src = mistake.solution_image;
        editSolutionPreviewImage.classList.remove('hidden');
        editClearSolutionImageBtn.classList.remove('hidden');
        editSolutionPasteHint.classList.add('hidden');
    } else {
        clearEditPastedSolutionImage();
    }
    
    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
    editForm.reset();
    clearEditPastedImage();
    clearEditPastedSolutionImage();
}

function openDeleteModal(id) {
    deleteTargetId = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    deleteTargetId = null;
    deleteModal.classList.add('hidden');
}

function openImageModal(src) {
    modalImage.src = src;
    imageModal.classList.remove('hidden');
}

// Utility Functions
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tab Navigation
function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Update buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}
