// --- Global Constants and Keys ---
const LOCAL_STORAGE_KEY = 'inspirationalQuotes';
const LOCAL_FILTER_KEY = 'lastSelectedFilter'; 
const SESSION_LAST_VIEWED_KEY = 'lastViewedQuote'; 

// Initial quotes array (used only if Local Storage is empty)
let quotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
    { text: "Success is not final; failure is not fatal: It is the courage to continue that counts.", category: "Success" },
];

// --- Web Storage Functions ---

/**
 * Saves the current 'quotes' array and the filter preference to Local Storage.
 */
function saveQuotes() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
    
    // Save the current filter preference (Task 2)
    const filter = document.getElementById("categoryFilter");
    if (filter) {
         localStorage.setItem(LOCAL_FILTER_KEY, filter.value);
    }
}

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
 * Helper function for JSON validation (used in import and session storage check).
 */
function isValidQuoteObject(q) {
    return q && typeof q.text === 'string' && q.text.trim() !== '' && 
           typeof q.category === 'string' && q.category.trim() !== '';
}


// --- Filtering and Category Management (Task 2 & 3) ---

/**
 * Populates the category dropdown menu dynamically and restores the last filter.
 */
function populateCategories() {
    const select = document.getElementById("categoryFilter"); // <--- CORRECTED ID
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
    const categoryFilter = document.getElementById("categoryFilter"); // <--- CORRECTED ID
    
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

// --- Main Quote Logic ---

function showRandomQuote() {
    const quoteDisplay = document.getElementById("quoteDisplay");

    const categoryFilter = document.getElementById("categoryFilter"); // <--- CORRECTED ID
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

    // Use Session Storage (Task 1 Optional)
    sessionStorage.setItem(SESSION_LAST_VIEWED_KEY, JSON.stringify(randomQuote));
}

/**
 * Adds a new quote, saves it, and updates the category dropdown (Task 3).
 */
function addQuote() {
    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();

    if (text === "" || category === "") {
        alert("Please fill in both fields.");
        return;
    }

    quotes.push({ text, category });

    // Save the updated list to Local Storage
    saveQuotes(); 
    
    // Update the category dropdown (in case a new category was added)
    populateCategories(); 

    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("Quote added, saved locally, and filter categories updated!");
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

            saveQuotes();
            populateCategories(); 

            alert(`Imported ${parsed.length} items. ${added} new quotes added.`);
            event.target.value = "";
        } catch (err) {
            console.error("Import failed:", err);
            alert("Failed to import: " + err.message);
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

// --- Dynamic UI Creation (Required for Task 2 HTML) ---

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
    let select = document.getElementById("categoryFilter"); // <--- CORRECTED ID
    if (select) return select;

    select = document.createElement("select");
    select.id = "categoryFilter"; // <--- CORRECTED ID
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
    // 1. Load data from Local Storage first
    loadQuotes(); 

    // 2. Create the display area
    const quoteDisplay = document.createElement("div");
    quoteDisplay.id = "quoteDisplay";
    quoteDisplay.style.margin = "20px 0";
    document.body.prepend(quoteDisplay);

    // 3. Create all UI controls
    createExportImportControls();
    createCategorySelector(); 
    createAddQuoteForm();

    // 4. Populate categories and apply the saved filter
    populateCategories(); 

    // 5. Check Session Storage for last viewed quote (Optional Task 1)
    try {
        const last = sessionStorage.getItem(SESSION_LAST_VIEWED_KEY);
        if (last) {
            const parsed = JSON.parse(last);
            if (isValidQuoteObject(parsed)) {
                // If a session quote is found, display it instead of running the filter display initially
                quoteDisplay.innerHTML = `<p style="font-style:italic;">"${parsed.text}" — (${parsed.category}) [Restored from last session]</p>`;
                return;
            }
        }
    } catch (err) {
         console.warn("Session storage item was corrupt.", err);
    }
    
    // If no session data is found, show the filtered quotes as determined by populateCategories/filterQuotes
    filterQuotes(document.getElementById("categoryFilter").value); // <--- CORRECTED ID
});