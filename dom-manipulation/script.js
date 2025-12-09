// Initial quotes array
let quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Success is not final; failure is not fatal: It is the courage to continue that counts.", category: "Success" },
];

// Function to show random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");

  const categorySelect = document.getElementById("categorySelect");
  const selectedCategory = categorySelect ? categorySelect.value : "All";

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

  quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
}

// Function to dynamically create the Add Quote form
function createAddQuoteForm() {
  const container = document.createElement("div");
  container.id = "quoteFormContainer";
  container.style.marginTop = "20px";

  // New Quote Text Input
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";
  textInput.style.display = "block";
  textInput.style.marginBottom = "10px";

  // New Quote Category Input
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.display = "block";
  categoryInput.style.marginBottom = "10px";

  // Add Quote Button
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  // Append all elements
  container.appendChild(textInput);
  container.appendChild(categoryInput);
  container.appendChild(addBtn);

  document.body.appendChild(container);
}
function addQuoteToLocalStorage() {
    const text = document.getElementById("quote-text").value.trim();
    const author = document.getElementById("quote-author").value.trim();

    if (text === "" || author === "") {
        alert("Please enter both quote and author.");
        return;
    }

    // Load existing quotes
    let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

    // Add new one
    quotes.push({
        text: text,
        author: author
    });

    // Save back
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Optional: refresh your quote list if you have a function
    if (typeof displayQuotes === "function") {
        displayQuotes();
    }

    // Clear inputs
    document.getElementById("quote-text").value = "";
    document.getElementById("quote-author").value = "";
}


// Update category options in dropdown
function updateCategoryOptions(select) {
  select.innerHTML = "";

  // Add "All" option
  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All Categories";
  select.appendChild(allOption);

  // Extract unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Create category dropdown dynamically
function createCategorySelector() {
  const existing = document.getElementById("categorySelect");
  if (existing) return;

  const select = document.createElement("select");
  select.id = "categorySelect";
  select.style.marginRight = "10px";

  updateCategoryOptions(select);

  const button = document.getElementById("newQuote");
  button.parentNode.insertBefore(select, button);
}

// Add quote to array and update dropdown
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text === "" || category === "") {
    alert("Please fill in both fields.");
    return;
  }

  quotes.push({ text, category });

  const select = document.getElementById("categorySelect");
  if (select) updateCategoryOptions(select);

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("Quote added!");
}

// Run dynamic setup when page loads
document.addEventListener("DOMContentLoaded", () => {
  createCategorySelector();
  createAddQuoteForm();

  const btn = document.getElementById("newQuote");
  btn.addEventListener("click", showRandomQuote);
});

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
  } catch (err) {
    console.error("Export failed:", err);
    alert("Could not export quotes.");
  }
}

// -------------------- JSON Import --------------------
function importFromJsonFile(event) {
  const file = event.target && event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array of quote objects.");

      if (!parsed.every(isValidQuoteObject)) {
        throw new Error("Each item must have non-empty 'text' and 'category' strings.");
      }

      // Merge while skipping duplicates (text + category uniqueness)
      const existingSet = new Set(quotes.map(q => `${q.text}|||${q.category}`));
      let added = 0;
      parsed.forEach(q => {
        const key = `${q.text}|||${q.category}`;
        if (!existingSet.has(key)) {
          quotes.push(q);
          existingSet.add(key);
          added++;
        }
      });

      saveQuotes();
      const sel = document.getElementById("categorySelect");
      if (sel) updateCategoryOptions(sel);

      alert(`Imported ${parsed.length} items. ${added} new quotes added (duplicates skipped).`);
      // clear input so same file can be re-imported if needed
      event.target.value = "";
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import: " + err.message);
      event.target.value = "";
    }
  };
  reader.onerror = function(err) {
    console.error("File read error", err);
    alert("Could not read the file.");
    event.target.value = "";
  };
  reader.readAsText(file);
}

// -------------------- Initialization --------------------
document.addEventListener("DOMContentLoaded", () => {
  // Load from localStorage
  loadQuotes();

  // Ensure UI controls exist and are wired
  const catSelect = createCategorySelector(); // creates if missing and updates
  createExportImportControls();
  createAddQuoteForm();

  // Wire show new quote button
  const newQuoteBtn = document.getElementById("newQuote");
  if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);

  // If session has last viewed quote, show it
  try {
    const last = sessionStorage.getItem(SESSION_LAST_VIEWED_KEY);
    if (last) {
      const parsed = JSON.parse(last);
      if (isValidQuoteObject(parsed)) {
        const quoteDisplay = document.getElementById("quoteDisplay");
        if (quoteDisplay) quoteDisplay.textContent = `"${parsed.text}" — (${parsed.category})`;
      }
    }
  } catch (err) {
    // ignore
  }

  // Ensure categorySelect has up-to-date options
  if (catSelect) updateCategoryOptions(catSelect);
});
// --- Constants (Ensure these are at the top of your script) ---
const LOCAL_STORAGE_KEY = 'inspirationalQuotes';
const LOCAL_FILTER_KEY = 'lastSelectedFilter'; 

// --- Web Storage Functions (Must be defined to support filtering and adding) ---

// Saves the current 'quotes' array to Local Storage.
function saveQuotes() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
}

// Loads quotes (assumed to be called in DOMContentLoaded)
// function loadQuotes() { ... } // (Assumed to be defined elsewhere in your script)
function populateCategories() {
    const select = document.getElementById("categorySelect");
    if (!select) return; 

    select.innerHTML = ""; // Clear existing options

    // Add "All" option
    const allOption = document.createElement("option");
    allOption.value = "All";
    allOption.textContent = "All Categories";
    select.appendChild(allOption);

    // Extract unique categories using a Set
    const categories = [...new Set(quotes.map(q => q.category))];

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    // Restore last selected filter (Step 2 requirement)
    const lastFilter = localStorage.getItem(LOCAL_FILTER_KEY);
    if (lastFilter && select.querySelector(`option[value="${lastFilter}"]`)) {
        select.value = lastFilter;
    }
    
    // Apply the filter after population/restoration
    filterQuotes(select.value);
}
function filterQuotes(category) {
    const quoteDisplay = document.getElementById("quoteDisplay");
    const categorySelect = document.getElementById("categorySelect");
    
    // Determine the category to filter by
    const selectedCategory = category || (categorySelect ? categorySelect.value : "All");

    // Filter the quotes array
    const filteredQuotes =
        selectedCategory === "All"
            ? quotes
            : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

    // Update displayed quotes
    if (quoteDisplay) {
        if (filteredQuotes.length === 0) {
            quoteDisplay.innerHTML = `<p>No quotes available for the category: <b>${selectedCategory}</b></p>`;
        } else {
            // Display all filtered quotes (instead of just one random one)
            const listHtml = filteredQuotes.map(q => 
                `<li style="margin-bottom: 8px;">"${q.text}" - <i>${q.category}</i></li>`
            ).join('');
            quoteDisplay.innerHTML = `<h3>Showing Quotes in Category: ${selectedCategory} (${filteredQuotes.length})</h3><ul>${listHtml}</ul>`;
        }
    }

    // Save the filter preference to Local Storage (Step 2 requirement)
    localStorage.setItem(LOCAL_FILTER_KEY, selectedCategory);
}
// --- Wiring within document.addEventListener("DOMContentLoaded", ...) ---
document.addEventListener("DOMContentLoaded", () => {
    // ... (loadQuotes() call must happen here first)

    // Ensure category selector is created (replace your old createCategorySelector)
    createCategorySelector(); 

    // Ensure the new filter function runs on selector change
    const selectElement = document.getElementById("categorySelect");
    if(selectElement) {
        selectElement.addEventListener("change", () => filterQuotes(selectElement.value));
    }

    // Populate categories and load the last saved filter preference
    populateCategories();
    
    // ... (rest of the initialization, like createAddQuoteForm(), etc.)
});

// A necessary adjustment to your createCategorySelector to hook the event listener:
function createCategorySelector() {
    let select = document.getElementById("categorySelect");
    if (select) {
        select.addEventListener("change", () => filterQuotes(select.value));
        return select;
    }
    // ... (rest of the creation logic)
}