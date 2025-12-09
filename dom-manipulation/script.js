let quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Success is not final; failure is not fatal: It is the courage to continue that counts.", category: "Success" },
];
//function to show random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById("quoteDisplay");
    //create dropdownfor categories if not already created
    createCategorySelector();

    const categorySelect = document.getElementById("categorySelect");
    const selectedCategory = categorySelect.value;
    //filter quotes by category
    const filteredQuotes = selectedCategory === "A11"
    ? quotes
    : quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

    if(filteredQuotes.length === 0) {
        quoteDisplay.textContent = "No quotes vailable for this category";
        return;
    }
    const randomIndex = Math.floor(Math.random()* filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
}

// Function to dynamically create category dropdown
function createCategorySelector() {
  if (document.getElementById("categorySelect")) return; // Prevent duplicates

  const categorySelect = document.createElement("select");
  categorySelect.id = "categorySelect";

  updateCategoryOptions(categorySelect);

  // Insert before newQuote button
  const button = document.getElementById("newQuote");
  button.parentNode.insertBefore(categorySelect, button);
}

// Update category options dynamically
function updateCategoryOptions(selectElement) {
  selectElement.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All Categories";
  selectElement.appendChild(allOption);

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectElement.appendChild(option);
  });
}

// Function to add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text === "" || category === "") {
    alert("Please fill in both fields.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);

  // Update category dropdown
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) updateCategoryOptions(categorySelect);

  // Clear form
  textInput.value = "";
  categoryInput.value = "";

  alert("Quote added successfully!");
}

// Event listeners
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
