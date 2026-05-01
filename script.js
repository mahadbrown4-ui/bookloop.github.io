const books = [
    { title: "A Chef's Secret", category: "Cooking", barcode: "97812345", image: "https://via.placeholder.com/150?text=Cooking" },
    { title: "Beyond the Stars", category: "Fiction", barcode: "97888211", image: "https://via.placeholder.com/150?text=Fiction" },
    { title: "Color My World", category: "Coloring", barcode: "97855432", image: "https://via.placeholder.com/150?text=Coloring" },
    { title: "Darkened Trails", category: "Fiction", barcode: "97800123", image: "https://via.placeholder.com/150?text=Fiction" },
    { title: "Easy Pastries", category: "Cooking", barcode: "97899887", image: "https://via.placeholder.com/150?text=Cooking" },
    { title: "Floral Patterns", category: "Coloring", barcode: "97877654", image: "https://via.placeholder.com/150?text=Coloring" },
];

let currentCategory = 'all';

function displayBooks(filter = 'all', query = '') {
    const grid = document.getElementById('book-grid');
    grid.innerHTML = '';

    // Alphabetical sort
    const sortedBooks = [...books].sort((a, b) => a.title.localeCompare(b.title));

    sortedBooks.forEach(book => {
        const matchesFilter = filter === 'all' || book.category === filter;
        const matchesQuery = book.title.toLowerCase().includes(query.toLowerCase()) || 
                             book.barcode.includes(query);

        if (matchesFilter && matchesQuery) {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <img src="${book.image}" alt="${book.title}">
                <h3>${book.title}</h3>
                <span class="barcode-label">||| ${book.barcode} |||</span>
                <button class="btn-action" onclick="openModal('${book.title}', '${book.barcode}')">Write Summary & Earn</button>
            `;
            grid.appendChild(card);
        }
    });
}

function filterCategory(cat) {
    currentCategory = cat;
    displayBooks(cat);
}

function searchBooks() {
    const val = document.getElementById('barcodeInput').value;
    displayBooks(currentCategory, val);
}

function openModal(title, barcode) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-barcode').innerText = "Barcode ID: " + barcode;
    document.getElementById('summary-modal').style.display = "block";
}

function closeModal() {
    document.getElementById('summary-modal').style.display = "none";
}

function submitSummary() {
    alert("Summary submitted! $0.50 has been added to your account.");
    closeModal();
    document.getElementById('summary-text').value = '';
}

// Initial Load
displayBooks();
