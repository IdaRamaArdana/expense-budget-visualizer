const App = (() => {
  const STORAGE_KEYS = {
    TRANSACTIONS: "transactions",
    CATEGORIES: "categories",
    THEME: "theme"
  };

  const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];

  const DOM = {
    form: document.getElementById("expenseForm"),
    itemName: document.getElementById("itemName"),
    amount: document.getElementById("amount"),
    category: document.getElementById("category"),
    transactionList: document.getElementById("transactionList"),
    totalBalance: document.getElementById("totalBalance"),
    sortSelect: document.getElementById("sortSelect"),
    themeToggle: document.getElementById("themeToggle"),
    customCategory: document.getElementById("customCategory"),
    addCategoryBtn: document.getElementById("addCategoryBtn"),
    chartCanvas: document.getElementById("expenseChart")
  };

  let transactions = [];
  let categories = [];
  let chart = null;

  function safeLoad(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function renderCategories() {
    DOM.category.innerHTML = `<option value="">Select Category</option>`;

    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      DOM.category.appendChild(option);
    });
  }

  function renderTransactions() {
    DOM.transactionList.innerHTML = "";

    if (!transactions.length) {
      DOM.transactionList.innerHTML = `
        <div class="empty-state">
          No transactions yet. Start by adding one.
        </div>
      `;
      updateTotal();
      updateChart();
      return;
    }

    const sorted = [...transactions];

    switch (DOM.sortSelect.value) {
      case "amountAsc":
        sorted.sort((a, b) => a.amount - b.amount);
        break;

      case "amountDesc":
        sorted.sort((a, b) => b.amount - a.amount);
        break;

      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;

      default:
        sorted.sort((a, b) => b.createdAt - a.createdAt);
    }

    sorted.forEach(tx => {
      const item = document.createElement("div");
      item.className = "transaction-item";

      item.innerHTML = `
        <div class="transaction-info">
          <strong>${tx.name}</strong>
          <span>${formatCurrency(tx.amount)}</span>
          <span class="transaction-category">${tx.category}</span>
        </div>
        <button class="delete-btn" data-id="${tx.id}">
          Delete
        </button>
      `;

      DOM.transactionList.appendChild(item);
    });

    updateTotal();
    updateChart();
  }

  function updateTotal() {
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    DOM.totalBalance.textContent = formatCurrency(total);
  }

  function updateChart() {
    const totals = {};

    transactions.forEach(tx => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });

    if (chart) chart.destroy();

    chart = new Chart(DOM.chartCanvas, {
      type: "pie",
      data: {
        labels: Object.keys(totals),
        datasets: [{
          data: Object.values(totals),
          backgroundColor: [
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  function addTransaction(e) {
    e.preventDefault();

    const name = DOM.itemName.value.trim();
    const amount = Number(DOM.amount.value);
    const category = DOM.category.value;

    if (!name || amount <= 0 || !category) {
      alert("Please fill all fields correctly.");
      return;
    }

    transactions.push({
      id: crypto.randomUUID(),
      name,
      amount,
      category,
      createdAt: Date.now()
    });

    save(STORAGE_KEYS.TRANSACTIONS, transactions);

    DOM.form.reset();

    renderTransactions();
  }

  function deleteTransaction(e) {
    if (!e.target.classList.contains("delete-btn")) return;

    const confirmed = confirm("Delete this transaction?");
    if (!confirmed) return;

    const id = e.target.dataset.id;

    transactions = transactions.filter(tx => tx.id !== id);

    save(STORAGE_KEYS.TRANSACTIONS, transactions);

    renderTransactions();
  }

  function addCategory() {
    const newCategory = DOM.customCategory.value.trim();

    if (!newCategory) return;

    const exists = categories.some(
      cat => cat.toLowerCase() === newCategory.toLowerCase()
    );

    if (exists) {
      alert("Category already exists.");
      return;
    }

    categories.push(newCategory);

    save(STORAGE_KEYS.CATEGORIES, categories);

    DOM.customCategory.value = "";

    renderCategories();
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
      STORAGE_KEYS.THEME,
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  }

  function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);

    if (theme === "dark") {
      document.body.classList.add("dark");
    }
  }

  function init() {
    transactions = safeLoad(STORAGE_KEYS.TRANSACTIONS, []);
    categories = safeLoad(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);

    loadTheme();
    renderCategories();
    renderTransactions();

    DOM.form.addEventListener("submit", addTransaction);
    DOM.transactionList.addEventListener("click", deleteTransaction);
    DOM.sortSelect.addEventListener("change", renderTransactions);
    DOM.themeToggle.addEventListener("click", toggleTheme);
    DOM.addCategoryBtn.addEventListener("click", addCategory);
  }

  return { init };
})();

App.init();