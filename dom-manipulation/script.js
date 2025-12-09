// --- Global Constants and Keys ---
const LOCAL_STORAGE_KEY = 'inspirationalQuotes';
const LOCAL_FILTER_KEY = 'lastSelectedFilter'; // Local Storage for filter preference
const SESSION_LAST_VIEWED_KEY = 'lastViewedQuote'; // Session Storage for last viewed quote
const SERVER_STORAGE_KEY = 'mockServerQuotes'; // Session Storage to mock server data
const LOCAL_CHANGES_PENDING_KEY = 'hasLocalChanges'; // Session Storage for sync status

// Initial quotes array (used only if Local Storage is empty)
let quotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
    { text: "Success is not final; failure is not fatal: It is the courage to continue that counts.", category: "Success" },
];

// --- Web Storage & Persistence Functions ---

/**
 * Loads quotes from Local Storage on application startup.
 */
function loadQuotes() {
    const storedQuotes = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedQuotes) {
        try {
            quotes = JSON.parse(storedQuotes);
        } catch (e) {
            console.error("Error parsing stored quotes. Using initial data.", e);
        }
    }
}

/**
 * Saves the current 'quotes' array and the filter preference to Local Storage.
 */
function saveQuotes() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
    
    // Save the current filter preference
    const filter = document.getElementById("categoryFilter");
    if (filter) {
         localStorage.setItem(LOCAL_FILTER_KEY, filter.value);
    }
}

/**
 * Helper function for JSON validation.
 */
function isValidQuoteObject(q) {
    return q && typeof q.text === 'string' && q.text.trim() !== '' && 
           typeof q.category === 'string' && q.category.trim() !== '';
}

// --- Server Sync Simulation (Task 3) ---

/**
 * Simulates fetching data from a server API (using Session Storage as the mock server).
 */
function fetchServerQuotes() {
    return new Promise(resolve => {
        setTimeout(() => {
            let serverData = sessionStorage.getItem(SERVER_STORAGE_KEY);
            if (!serverData) {
                // Initialize server data with the current local data if server is empty
                serverData = localStorage.getItem(LOCAL_STORAGE_KEY) || JSON.stringify(quotes);
                sessionStorage.setItem(SERVER_STORAGE_KEY, serverData);
            }
            resolve(JSON.parse(serverData));
        }, 1000); // Simulate 1 second network latency
    });
}

/**
 * Simulates posting the current local quotes array to the server.
 */
function postLocalQuotesToServer() {
    return new Promise(resolve => {
        setTimeout(() => {
            sessionStorage.setItem(SERVER_STORAGE_KEY, JSON.stringify(quotes));
            sessionStorage.removeItem(LOCAL_CHANGES_PENDING_KEY); // Clear pending changes
            resolve();
        }, 800);
    });
}

/**
 * Primary sync function with Server Precedence conflict resolution.
 */
async function syncData() {
    const hasPendingChanges = sessionStorage.getItem(LOCAL_CHANGES_PENDING_KEY);
    const notificationElement = document.getElementById('syncNotification');
    if (!notificationElement) return;

    notificationElement.textContent = "Syncing with server...";
    notificationElement.style.backgroundColor = '#ffcc80';

    try {
        const serverQuotes = await fetchServerQuotes();
        
        let localQuoteCount = quotes.length;
        let serverQuoteCount = serverQuotes.length;
        
        // --- CONFLICT RESOLUTION: Server Precedence ---
        if (serverQuoteCount > localQuoteCount) {
            // Server has new data, overwrite local changes
            quotes = serverQuotes;
            saveQuotes();
            populateCategories(); 
            
            let added = serverQuoteCount - localQuoteCount;
            notificationElement.textContent = `✅ Server Sync: ${added} new quote(s) loaded. Local changes discarded.`;
            notificationElement.style.backgroundColor = '#b3e0b3';
            
            sessionStorage.removeItem(LOCAL_CHANGES_PENDING_KEY);

        } else if (hasPendingChanges) {
            // Local changes exist and server doesn't have newer data: Push local changes
            await postLocalQuotesToServer();
            notificationElement.textContent = `⬆️ Local Sync: ${localQuoteCount} quote(s) successfully pushed to server.`;
            notificationElement.style.backgroundColor = '#a0c4ff';

        } else {
            // NO CHANGES
            notificationElement.textContent = `🔄 Sync Complete. Data is consistent.`;
            notificationElement.style.backgroundColor = '#ccebff';
        }

    } catch (error) {
        console.error("Sync failed:", error);
        notificationElement.textContent = `❌ Sync Failed. Check console for details.`;
        notificationElement.style.backgroundColor = '#ffb3b3';
    }
    
    // Clear notification after a delay
    setTimeout(() => {
        notificationElement.textContent = 'Awaiting next sync...';
        notificationElement.style.backgroundColor = '#f0f0f0';
    }, 5000);
}

/**
 * Marks that a local change has occurred and triggers a sync.
 */
function markLocalChangeAndSync() {
    sessionStorage.setItem(LOCAL_CHANGES_PENDING_KEY, 'true');
    saveQuotes(); // Always save the local change first
    syncData();
}

// --- Filtering and Category Management (Task 2) ---

/**
 * Populates the category dropdown menu dynamically and restores the last filter.
 */
function populateCategories() {
    const select = document.getElementById("categoryFilter");
    if (!select) return; 

    select.innerHTML = ""; // Clear existing options

    // Add "All" option
    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All Categories";
    select.appendChild(allOption);

    // Extract unique categories from the current quote data
    const categories = [...new Set(quotes.map(q => q.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    // Restore last selected filter from Local Storage
    const lastFilter = localStorage.getItem(LOCAL_FILTER_KEY);
    if (lastFilter && select.querySelector(`option[value="${lastFilter}"]`)) {
        select.value = lastFilter;
    }
    
    // Apply the filter after population/restoration
    filterQuotes(select.value);
}

/**
 * Filters the quotes displayed based on the selected category and saves the preference.
 */
function filterQuotes(category) {
    const quoteDisplay = document.getElementById("quoteDisplay");
    const categoryFilter = document.getElementById("categoryFilter");
    
    const selectedCategory = category || (categoryFilter ? categoryFilter.value : "All");

    const filteredQuotes =
        selectedCategory === "All"
            ? quotes
            : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

    // Update displayed quotes
    if (quoteDisplay) {
        if (filteredQuotes.length === 0) {
            quoteDisplay.innerHTML = `<p>No quotes available for the category: <b>${selectedCategory}</b></p>`;
        } else {
            const listHtml = filteredQuotes.map(q => 
                `<li style="margin-bottom: 8px;">"${q.text}" - <i>${q.category}</i></li>`
            ).join('');
            quoteDisplay.innerHTML = `<h3>Showing Quotes in Category: ${selectedCategory} (${filteredQuotes.length})</h3><ul>${listHtml}</ul>`;
        }
    }

    // Save the filter preference to Local Storage
    localStorage.setItem(LOCAL_FILTER_KEY, selectedCategory);
}

// --- Main Quote Logic (Task 1 & 3) ---

function showRandomQuote() {
    const quoteDisplay = document.getElementById("quoteDisplay");

    const categoryFilter = document.getElementById("categoryFilter");
    const selectedCategory = categoryFilter ? categoryFilter.value : "All";

    const filteredQuotes =
        selectedCategory === "All"
            ? quotes
            : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

    if (filteredQuotes.length === 0) {
        quoteDisplay.textContent = "No quotes available for this category.";
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];

    quoteDisplay.textContent = `RANDOM: "${randomQuote.text}" — (${randomQuote.category})`;

    // Use Session Storage (Task 1)
    sessionStorage.setItem(SESSION_LAST_VIEWED_KEY, JSON.stringify(randomQuote));
}

/**
 * Adds a new quote, marks it as a pending local change, and initiates sync (Task 3).
 */
function addQuote() {
    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();

    if (text === "" || category === "") {
        alert("Please fill in both fields.");
        return;
    }

    quotes.push({ text, category });

    // Mark the change and sync immediately
    markLocalChangeAndSync();
    
    // Update the category dropdown (in case a new category was added)
    populateCategories(); 

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("Quote added locally and sync initiated.");
}


// --- JSON Data Import/Export (Task 1) ---

function exportToJson() {
    try {
        const dataStr = JSON.stringify(quotes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quotes_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        alert("Quotes exported successfully!");
    } catch (err) {
        console.error("Export failed:", err);
        alert("Could not export quotes.");
    }
}

function importFromJsonFile(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!Array.isArray(parsed) || !parsed.every(isValidQuoteObject)) {
                throw new Error("Invalid JSON format. Expected an array of objects with 'text' and 'category'.");
            }

            // Merge while skipping duplicates
            const existingSet = new Set(quotes.map(q => `${q.text}|||${q.category}`));
            let added = 0;
            parsed.forEach(q => {
                const key = `${q.text}|||${q.category}`;
                if (!existingSet.has(key)) {
                    quotes.push(q);
                    added++;
                }
            });

            // Treat import as a local change
            markLocalChangeAndSync(); 
            populateCategories(); 

            alert(`Imported ${parsed.length} items. ${added} new quotes added. Sync initiated.`);
            event.target.value = "";
        } catch (err) {
            console.error("Import failed:", err);
            alert("Failed to import: " + err.message);
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

// --- Dynamic UI Creation ---

function createSyncUI() {
    const container = document.createElement('div');
    container.id = 'syncContainer';
    container.style.marginTop = '15px';
    container.style.padding = '10px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '5px';
    container.style.textAlign = 'center';
    
    container.innerHTML = `
        <h3 style="margin-top:0;">Server Sync Status</h3>
        <p id="syncNotification" style="padding: 5px; background-color: #f0f0f0; border-radius: 3px;">
            Initializing sync...
        </p>
        <button onclick="syncData()" style="margin-top: 5px;">Force Sync Now</button>
    `;
    document.body.prepend(container);
}

function createAddQuoteForm() {
    const container = document.getElementById("quoteFormContainer") || document.createElement("div");
    container.id = "quoteFormContainer";
    container.style.marginTop = "20px";
    container.innerHTML = `
        <h2>Add New Quote</h2>
        <input type="text" id="newQuoteText" placeholder="Enter a new quote" style="display:block; margin-bottom:10px;">
        <input type="text" id="newQuoteCategory" placeholder="Enter quote category" style="display:block; margin-bottom:10px;">
        <button id="addQuoteBtn">Add Quote</button>
    `;
    document.body.appendChild(container);
    document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

function createCategorySelector() {
    let select = document.getElementById("categoryFilter");
    if (select) return select;

    select = document.createElement("select");
    select.id = "categoryFilter";
    select.style.marginRight = "10px";
    select.addEventListener("change", () => filterQuotes(select.value));

    const controlsContainer = document.getElementById("controlsContainer");
    if (controlsContainer) {
         controlsContainer.prepend(select);
    } else {
        document.body.prepend(select); 
    }
    return select;
}

function createExportImportControls() {
    let controlsContainer = document.getElementById("controlsContainer");
    if (!controlsContainer) {
        controlsContainer = document.createElement("div");
        controlsContainer.id = "controlsContainer";
        controlsContainer.style.marginBottom = '10px';
        document.body.prepend(controlsContainer);
    }
    
    // Show Random Quote Button
    let btn = document.getElementById("newQuote");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "newQuote";
        btn.textContent = "Show Random Quote";
        btn.addEventListener("click", showRandomQuote);
        controlsContainer.appendChild(btn);
    }

    // Export Button
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export JSON";
    exportBtn.addEventListener("click", exportToJson);
    controlsContainer.appendChild(exportBtn);

    // Import File Input
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.id = "importFile";
    importInput.accept = ".json";
    importInput.onchange = importFromJsonFile;
    
    const importLabel = document.createElement("label");
    importLabel.textContent = " | Import JSON: ";
    importLabel.appendChild(importInput);

    controlsContainer.appendChild(importLabel);
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load data from Local Storage
    loadQuotes(); 

    // 2. Create the display area
    const quoteDisplay = document.createElement("div");
    quoteDisplay.id = "quoteDisplay";
    quoteDisplay.style.margin = "20px 0";
    document.body.prepend(quoteDisplay);

    // 3. Create all UI controls
    createSyncUI(); // Task 3 UI
    createExportImportControls();
    createCategorySelector(); 
    createAddQuoteForm();

    // 4. Populate categories and apply the saved filter
    populateCategories(); 

    // 5. Initial Data Sync (Task 3)
    syncData();
    
    // 6. Periodic Data Sync
    setInterval(syncData, 60000); // Sync every 60 seconds (1 minute)

    // 7. Check Session Storage for last viewed quote (Optional Task 1)
    try {
        const last = sessionStorage.getItem(SESSION_LAST_VIEWED_KEY);
        if (last) {
            const parsed = JSON.parse(last);
            if (isValidQuoteObject(parsed)) {
                console.log(`Restored last viewed quote from session: ${parsed.text}`);
                // You may want to show this quote, but we prioritize the filter display
            }
        }
    } catch (err) {
         console.warn("Session storage item was corrupt.", err);
    }
    
    // Initial display of filtered quotes
    filterQuotes(document.getElementById("categoryFilter").value);
});