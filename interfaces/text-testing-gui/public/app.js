// Text Testing GUI Application Logic

// API Configuration
const API_URL = 'https://text.example.com';

// State
const state = {
    isGenerating: false
};

// DOM Elements
const elements = {
    form: document.getElementById('generateForm'),
    apiKey: document.getElementById('apiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    instanceId: document.getElementById('instanceId'),
    prompt: document.getElementById('prompt'),
    promptLength: document.getElementById('promptLength'),
    model: document.getElementById('model'),
    maxTokens: document.getElementById('maxTokens'),
    temperature: document.getElementById('temperature'),
    generateBtn: document.getElementById('generateBtn'),
    statusMessage: document.getElementById('statusMessage'),
    toggleAdvanced: document.getElementById('toggleAdvanced'),
    advancedArrow: document.getElementById('advancedArrow'),
    advancedOptions: document.getElementById('advancedOptions'),
    noResults: document.getElementById('noResults'),
    loadingState: document.getElementById('loadingState'),
    loadingMessage: document.getElementById('loadingMessage'),
    resultsDisplay: document.getElementById('resultsDisplay'),
    generatedText: document.getElementById('generatedText'),
    copyTextBtn: document.getElementById('copyTextBtn'),
    metaProvider: document.getElementById('metaProvider'),
    metaModel: document.getElementById('metaModel'),
    metaTokens: document.getElementById('metaTokens'),
    metaTime: document.getElementById('metaTime'),
    metaRequestId: document.getElementById('metaRequestId')
};

// Initialize
function init() {
    setupEventListeners();
    loadSavedSettings();
}

// Setup Event Listeners
function setupEventListeners() {
    // Form submission
    elements.form.addEventListener('submit', handleSubmit);

    // API Key toggle
    elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);

    // Prompt character count
    elements.prompt.addEventListener('input', updatePromptLength);

    // Advanced options toggle
    elements.toggleAdvanced.addEventListener('click', toggleAdvancedOptions);

    // Copy text button
    elements.copyTextBtn.addEventListener('click', copyText);
}

// Load saved settings from localStorage
function loadSavedSettings() {
    const savedApiKey = localStorage.getItem('textGenApiKey');
    const savedInstanceId = localStorage.getItem('textGenInstanceId');
    const savedModel = localStorage.getItem('textGenModel');

    if (savedApiKey) {
        elements.apiKey.value = savedApiKey;
    }

    if (savedInstanceId) {
        elements.instanceId.value = savedInstanceId;
    }

    if (savedModel) {
        elements.model.value = savedModel;
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('textGenApiKey', elements.apiKey.value);
    localStorage.setItem('textGenInstanceId', elements.instanceId.value);
    localStorage.setItem('textGenModel', elements.model.value);
}

// Toggle API Key Visibility
function toggleApiKeyVisibility() {
    const type = elements.apiKey.type;
    elements.apiKey.type = type === 'password' ? 'text' : 'password';
}

// Update Prompt Length Counter
function updatePromptLength() {
    const length = elements.prompt.value.length;
    elements.promptLength.textContent = `${length} characters`;
}

// Toggle Advanced Options
function toggleAdvancedOptions() {
    const isHidden = elements.advancedOptions.classList.contains('hidden');

    if (isHidden) {
        elements.advancedOptions.classList.remove('hidden');
        elements.advancedArrow.textContent = '▼';
    } else {
        elements.advancedOptions.classList.add('hidden');
        elements.advancedArrow.textContent = '▶';
    }
}

// Copy Text to Clipboard
function copyText() {
    const text = elements.generatedText.textContent;
    navigator.clipboard.writeText(text);
    elements.copyTextBtn.textContent = '✓ Copied!';
    setTimeout(() => {
        elements.copyTextBtn.textContent = 'Copy Text';
    }, 2000);
}

// Handle Form Submission
async function handleSubmit(e) {
    e.preventDefault();

    if (state.isGenerating) {
        return;
    }

    // Save settings
    saveSettings();

    // Get form data
    const apiKey = elements.apiKey.value.trim();
    const instanceId = elements.instanceId.value;
    const prompt = elements.prompt.value.trim();
    const model = elements.model.value;
    const maxTokens = parseInt(elements.maxTokens.value);
    const temperature = parseFloat(elements.temperature.value);

    // Validate
    if (!apiKey || !instanceId || !prompt || !model) {
        showError('Please fill in all required fields');
        return;
    }

    // Show loading state
    showLoadingState();

    try {
        // Call API
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                prompt,
                model,
                instance_id: instanceId,
                options: {
                    max_tokens: maxTokens,
                    temperature
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Show results
        displayResults(data);
        showSuccess('Text generated successfully!');
    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || 'Failed to generate text. Please check your API key and try again.');
        resetToNoResults();
    }
}

// Show Loading State
function showLoadingState() {
    state.isGenerating = true;
    elements.generateBtn.disabled = true;
    elements.generateBtn.textContent = 'Generating...';
    elements.noResults.classList.add('hidden');
    elements.resultsDisplay.classList.add('hidden');
    elements.loadingState.classList.remove('hidden');
    elements.statusMessage.classList.add('hidden');
}

// Reset to No Results
function resetToNoResults() {
    state.isGenerating = false;
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = 'Generate Text';
    elements.loadingState.classList.add('hidden');
    elements.resultsDisplay.classList.add('hidden');
    elements.noResults.classList.remove('hidden');
}

// Display Results
function displayResults(data) {
    state.isGenerating = false;
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = 'Generate Text';

    // Hide loading, show results
    elements.loadingState.classList.add('hidden');
    elements.noResults.classList.add('hidden');
    elements.resultsDisplay.classList.remove('hidden');

    // Set text
    elements.generatedText.textContent = data.text;

    // Set metadata
    elements.metaProvider.textContent = data.metadata.provider;
    elements.metaModel.textContent = data.metadata.model;
    elements.metaTokens.textContent = data.metadata.tokens_used.toLocaleString();
    elements.metaTime.textContent = `${data.metadata.generation_time_ms}ms`;
    elements.metaRequestId.textContent = data.request_id;
}

// Show Error Message
function showError(message) {
    elements.statusMessage.className = 'mt-4 p-4 rounded-md bg-red-50 border border-red-200';
    elements.statusMessage.innerHTML = `
        <p class="text-sm font-medium text-red-800">${message}</p>
    `;
    elements.statusMessage.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.statusMessage.classList.add('hidden');
    }, 5000);
}

// Show Success Message
function showSuccess(message) {
    elements.statusMessage.className = 'mt-4 p-4 rounded-md bg-green-50 border border-green-200';
    elements.statusMessage.innerHTML = `
        <p class="text-sm font-medium text-green-800">${message}</p>
    `;
    elements.statusMessage.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        elements.statusMessage.classList.add('hidden');
    }, 3000);
}

// Start the application
init();
