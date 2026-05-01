// js/script.js
const App = (() => {
  const STORAGE = {
    TRANSACTIONS: "transactions",
    CATEGORIES: "categories",
    THEME: "theme",
    LIMIT: "spendingLimit"
  };

  const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];

  const DOM = {
    form: document.getElementById("expenseForm"),
    itemName: document.getElementById("itemName"),
    amount: document.getElementById("amount"),
    category: document.getElementById("category"),
    customCategory: document.getElementById("customCategory"),
    addCategoryBtn: document.getElementById("addCategoryBtn"),
    transactionList: document.getElementById("transactionList"),
    totalBalance: document.getElementById("totalBalance"),
    spendingLimit: document.getElementById("spendingLimit"),
    budgetProgress: document.getElementById("budgetProgress"),
    budgetStatus: document.getElementById("budgetStatus"),
    themeToggle: document.getElementById("themeToggle"),
    chartCanvas: document.getElementById("expenseChart")
  };

  let transactions = [];
  let categories = [];
  let chart = null;

  const load = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

  const formatCurrency = amount =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);

  function getThemeIcon() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "☀️" : "🌙";
  }

  function updateThemeIcon() {
    DOM.themeToggle.textContent = getThemeIcon();
  }

  function renderCategories() {
    DOM.category.innerHTML =
      `<option value="">Select Category</option>`;

    categories.forEach(cat => {
      DOM.category.innerHTML +=
        `<option value="${cat}">${cat}</option>`;
    });
  }

  function renderTransactions() {
    DOM.transactionList.innerHTML = "";

    if (!transactions.length) {
      DOM.transactionList.innerHTML =
        `<div class="empty-state">No transactions yet.</div>`;
      updateSummary();
      updateChart();
      return;
    }

    const limit =
      Number(localStorage.getItem(STORAGE.LIMIT)) || Infinity;

    transactions
      .slice()
      .reverse()
      .forEach(tx => {
        const item = document.createElement("div");

        item.className = "transaction-item";

        if (tx.amount > limit) {
          item.classList.add("over-limit");
        }

        item.innerHTML = `
          <div class="transaction-meta">
            <strong>${tx.name}</strong>
            <span>${formatCurrency(tx.amount)}</span>
            <small>${tx.category}</small>
          </div>
          <button class="delete-btn" data-id="${tx.id}">
            Delete
          </button>
        `;

        DOM.transactionList.appendChild(item);
      });

    updateSummary();
    updateChart();
  }

  function updateSummary() {
    const total =
      transactions.reduce((sum, tx) => sum + tx.amount, 0);

    DOM.totalBalance.textContent = formatCurrency(total);

    const limit =
      Number(localStorage.getItem(STORAGE.LIMIT));

    if (!limit) {
      DOM.budgetProgress.style.width = "0%";
      DOM.budgetStatus.textContent = "No limit set";
      return;
    }

    const percentage = Math.min((total / limit) * 100, 100);

    DOM.budgetProgress.style.width = `${percentage}%`;

    if (total > limit) {
      DOM.budgetProgress.style.background = "var(--danger)";
      DOM.budgetStatus.textContent =
        `Over budget by ${formatCurrency(total - limit)}`;
    } else {
      DOM.budgetProgress.style.background = "var(--success)";
      DOM.budgetStatus.textContent =
        `${formatCurrency(limit - total)} remaining`;
    }
  }

  function updateChart() {
    const grouped = {};

    transactions.forEach(tx => {
      grouped[tx.category] =
        (grouped[tx.category] || 0) + tx.amount;
    });

    if (chart) chart.destroy();

    chart = new Chart(DOM.chartCanvas, {
      type: "doughnut",
      data: {
        labels: Object.keys(grouped),
        datasets: [{
          data: Object.values(grouped),
          backgroundColor: [
            "#2563EB",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom"
          }
        }
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
      id: Date.now().toString(),
      name,
      amount,
      category
    });

    save(STORAGE.TRANSACTIONS, transactions);

    DOM.form.reset();

    renderTransactions();
  }

  function deleteTransaction(e) {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    transactions =
      transactions.filter(tx => tx.id !== btn.dataset.id);

    save(STORAGE.TRANSACTIONS, transactions);

    renderTransactions();
  }

  function addCategory() {
    const newCategory =
      DOM.customCategory.value.trim();

    if (!newCategory) return;

    if (
      categories.some(
        cat =>
          cat.toLowerCase() ===
          newCategory.toLowerCase()
      )
    ) {
      alert("Category already exists.");
      return;
    }

    categories.push(newCategory);

    save(STORAGE.CATEGORIES, categories);

    DOM.customCategory.value = "";

    renderCategories();
  }

  function updateLimit() {
    const limit = Number(DOM.spendingLimit.value);

    if (limit > 0) {
      save(STORAGE.LIMIT, limit);
    } else {
      localStorage.removeItem(STORAGE.LIMIT);
    }

    renderTransactions();
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
      STORAGE.THEME,
      document.body.classList.contains("dark")
        ? "dark"
        : "light"
    );

    updateThemeIcon();
  }

  function loadTheme() {
    if (localStorage.getItem(STORAGE.THEME) === "dark") {
      document.body.classList.add("dark");
    }

    updateThemeIcon();
  }

  function init() {
    transactions = load(STORAGE.TRANSACTIONS, []);
    categories = load(STORAGE.CATEGORIES, DEFAULT_CATEGORIES);

    DOM.spendingLimit.value =
      localStorage.getItem(STORAGE.LIMIT) || "";

    loadTheme();

    renderCategories();
    renderTransactions();

    DOM.form.addEventListener("submit", addTransaction);
    DOM.transactionList.addEventListener("click", deleteTransaction);
    DOM.addCategoryBtn.addEventListener("click", addCategory);
    DOM.spendingLimit.addEventListener("input", updateLimit);
    DOM.themeToggle.addEventListener("click", toggleTheme);
  }

  return { init };
})();

App.init();