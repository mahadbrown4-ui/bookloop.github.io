/**
 * BOOKLOOP - SUPABASE INTEGRATION
 * Replace the placeholders below with your actual Project credentials
 * found in: Supabase Dashboard > Settings > API
 */
const _supabaseUrl = https://xqtiznbeyhxmbqabvava.supabase.co
const _supabaseKey = sb_publishable_RMesAsFoVDMIgOyOxulzlQ_Gt2foYq-
const supabase = lib.createClient(_supabaseUrl, _supabaseKey);

let currentCategory = 'all';

/**
 * 1. DISPLAY BOOKS
 * Fetches books from Supabase with optional filtering and search.
 */
async function displayBooks(filter = 'all', query = '') {
    const grid = document.getElementById('book-grid');
    grid.innerHTML = '<div class="status-msg">Loading Library...</div>';

    // Start building the Supabase query
    // We order by title alphabetically directly in the database
    let supabaseQuery = supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

    // Apply Category Filter
    if (filter !== 'all') {
        supabaseQuery = supabaseQuery.eq('category', filter);
    }

    // Apply Search/Barcode Logic
    if (query !== '') {
        // This checks if the title contains the query (case-insensitive) 
        // OR if the barcode is an exact match
        supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,barcode.eq.${query}`);
    }

    const { data: books, error } = await supabaseQuery;

    if (error) {
        console.error('Fetch Error:', error);
        grid.innerHTML = '<div class="status-msg">Error loading books. Please try again.</div>';
        return;
    }

    // Clear grid and render books
    grid.innerHTML = '';

    if (books.length === 0) {
        grid.innerHTML = '<div class="status-msg">No books found.</div>';
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <img src="${book.image_url}" alt="${book.title}">
            <h3>${book.title}</h3>
            <span class="barcode-label">||| ${book.barcode} |||</span>
            <button class="btn-action" onclick="openModal('${book.id}', '${book.title}', '${book.barcode}')">
                Write Summary & Earn
            </button>
        `;
        grid.appendChild(card);
    });
}

/**
 * 2. FILTERING & SEARCHING
 */
function filterCategory(cat) {
    currentCategory = cat;
    displayBooks(cat);
}

function searchBooks() {
    const val = document.getElementById('barcodeInput').value;
    displayBooks(currentCategory, val);
}

/**
 * 3. MODAL MANAGEMENT
 */
function openModal(bookId, title, barcode) {
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerText = title;
    
    // Store the database ID in a data attribute for the submission step
    modalTitle.dataset.bookId = bookId; 
    
    document.getElementById('modal-barcode').innerText = "Barcode ID: " + barcode;
    document.getElementById('summary-modal').style.display = "block";
}

function closeModal() {
    document.getElementById('summary-modal').style.display = "none";
    document.getElementById('summary-text').value = '';
}

/**
 * 4. EARN LOGIC: SUBMIT SUMMARY TO DATABASE
 */
async function submitSummary() {
    const bookId = document.getElementById('modal-title').dataset.bookId;
    const content = document.getElementById('summary-text').value;

    if (!content.trim()) {
        alert("Please write a summary before submitting!");
        return;
    }

    // Insert the summary into your 'summaries' table
    const { error } = await supabase
        .from('summaries')
        .insert([{ 
            book_id: bookId, 
            content: content,
            amount_earned: 0.50 // Standard reward
        }]);

    if (error) {
        console.error('Submit Error:', error);
        alert("Could not save summary: " + error.message);
    } else {
        alert("Summary submitted! $0.50 has been added to your account.");
        closeModal();
    }
}

// 5. INITIALIZATION
// Trigger the first fetch when the page loads
displayBooks();
