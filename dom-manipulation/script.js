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

