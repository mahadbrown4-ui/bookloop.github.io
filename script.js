/**
 * --- TECHNICAL INSTRUCTIONS FOR CONNECTING SUPABASE ---
 * 1. Create a Project on your Supabase Dashboard.
 * 2. Navigate to Project Settings -> API, and copy your unique Project URL and 'anon' public key.
 * 3. Replace the placeholder text inside the two variables below.
 * 4. Configure Authentication Redirects: Ensure your production server address 
 * (e.g., your GitHub Pages URL) is saved inside your Supabase Auth Redirect settings list.
 */

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ANON_KEY";

// Dynamic Client Initialization Wrapper
let supabase = null;
if (SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
    console.log("ℹ️ Running in Sandbox Presentation Mode. Connect your Supabase API keys to toggle real-time table queries.");
} else {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Client application runtime state cache
let mockSessionUser = null;
let appState = {
    summaries: [],
    scholarships: [
        { id: 1, name: "STEM Excellence Scholarship", provider: "Future Tech Foundation", amount: 5000, deadline: "2026-06-30", category: "Science & Tech", desc: "Awarded to high school seniors pursuing computing, engineering, or mathematics programs." },
        { id: 2, name: "Women in Business Grant", provider: "Empower Leadership Network", amount: 7500, deadline: "2026-07-15", category: "Business", desc: "Supports undergraduate female students entering leadership, entrepreneurship, or finance disciplines." },
        { id: 3, name: "Civic Literacy Community Award", provider: "Metropolitan Alliance", amount: 1500, deadline: "2026-05-25", category: "History", desc: "For applicants with notable social track records submitting analytical essays on structural policies." }
    ],
    userProfile: { balance: 0.00, submissionsCount: 0, savedCount: 0 }
};

// Application Global DOM Selector Map
const DOM = {
    authSection: document.getElementById('auth-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    btnLogin: document.getElementById('btn-login'),
    btnSignup: document.getElementById('btn-signup'),
    btnGoogleAuth: document.getElementById('btn-google-auth'),
    btnLogout: document.getElementById('btn-logout'),
    userDisplayEmail: document.getElementById('user-display-email'),
    rewardBalance: document.getElementById('reward-balance'),
    summaryCount: document.getElementById('summary-count'),
    scholarshipCount: document.getElementById('scholarship-count'),
    summaryForm: document.getElementById('summary-form'),
    bookTitle: document.getElementById('book-title'),
    bookAuthor: document.getElementById('book-author'),
    bookIsbn: document.getElementById('book-isbn'),
    bookCategory: document.getElementById('book-category'),
    summaryText: document.getElementById('summary-text'),
    btnScan: document.getElementById('btn-scan'),
    submissionsList: document.getElementById('submissions-list'),
    scholarshipsList: document.getElementById('scholarships-list'),
    scholarshipSearch: document.getElementById('scholarship-search'),
    filterFunding: document.getElementById('filter-funding'),
    filterDeadline: document.getElementById('filter-deadline'),
    toast: document.getElementById('toast')
};

// --- INITIALIZATION PIPELINE ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkActiveSession();
    renderScholarships();
});

function setupEventListeners() {
    DOM.authForm.addEventListener('submit', handleEmailAuth);
    DOM.btnSignup.addEventListener('click', handleEmailSignup);
    DOM.btnGoogleAuth.addEventListener('click', handleGoogleOAuth);
    DOM.btnLogout.addEventListener('click', handleSignOut);
    DOM.summaryForm.addEventListener('submit', handleSummarySubmission);
    DOM.btnScan.addEventListener('click', executeBarcodeScannerSimulation);
    DOM.scholarshipSearch.addEventListener('input', renderScholarships);
    DOM.filterFunding.addEventListener('change', renderScholarships);
    DOM.filterDeadline.addEventListener('change', renderScholarships);
}

// --- APP TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type}`;
    DOM.toast.classList.remove('hidden');
    setTimeout(() => DOM.toast.classList.add('hidden'), 4000);
}

// --- ACCOUNT ACCESS MANAGEMENT CONTROLLERS ---
async function checkActiveSession() {
    if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
            syncAuthenticatedUI(session.user);
            return;
        }
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) syncAuthenticatedUI(session.user);
            else syncDeauthenticatedUI();
        });
    } else {
        const preservedUser = localStorage.getItem('mock_user');
        if (preservedUser) {
            mockSessionUser = JSON.parse(preservedUser);
            syncAuthenticatedUI(mockSessionUser);
        }
    }
}

function syncAuthenticatedUI(user) {
    DOM.authSection.classList.add('hidden');
    DOM.dashboardSection.classList.remove('hidden');
    DOM.btnLogout.classList.remove('hidden');
    DOM.userDisplayEmail.textContent = user.email;
    fetchUserCloudData(user.id || 'mock-id');
}

function syncDeauthenticatedUI() {
    DOM.authSection.classList.remove('hidden');
    DOM.dashboardSection.classList.add('hidden');
    DOM.btnLogout.classList.add('hidden');
    DOM.userDisplayEmail.textContent = "";
}

// --- ASYNCHRONOUS DATA PIPELINES & ALIGNMENT ---
async function fetchUserCloudData(userId) {
    if (supabase) {
        try {
            // Read summary rows linked to the user account
            let { data: summaries, error: sumErr } = await supabase
                .from('summaries')
                .select('*')
                .order('created_at', { ascending: false });
            if (!sumErr) appState.summaries = summaries || [];

            // Query metric profiles
            let { data: profile, error: profErr } = await supabase
                .from('profiles')
                .select('balance, submissions_count, saved_scholarships_count')
                .eq('id', userId)
                .single();
            if (!profErr && profile) {
                appState.userProfile.balance = profile.balance;
                appState.userProfile.submissionsCount = profile.submissions_count;
                appState.userProfile.savedCount = profile.saved_scholarships_count;
            }
        } catch (err) {
            console.warn("Database reading encounter anomaly, transitioning to playground dataset mapping.", err);
        }
    } else {
        const storedLogs = localStorage.getItem(`logs_${userId}`);
        if (storedLogs) appState.summaries = JSON.parse(storedLogs);
        const storedProfile = localStorage.getItem(`profile_${userId}`);
        if (storedProfile) appState.userProfile = JSON.parse(storedProfile);
    }
    updateDashboardMetrics();
    renderSummaryLog();
}

function updateDashboardMetrics() {
    DOM.rewardBalance.textContent = `$${parseFloat(appState.userProfile.balance).toFixed(2)}`;
    DOM.summaryCount.textContent = appState.summaries.length;
    DOM.scholarshipCount.textContent = appState.userProfile.savedCount;
}

// --- AUTHENTICATION PROVIDER FUNCTIONS ---
async function handleEmailAuth(e) {
    e.preventDefault();
    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value;
    
    if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) showToast(error.message, 'error');
    } else {
        mockSessionUser = { id: 'usr_sandbox', email: email };
        localStorage.setItem('mock_user', JSON.stringify(mockSessionUser));
        syncAuthenticatedUI(mockSessionUser);
        showToast("Authenticated via Local Sandbox Layer.");
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value;
    
    if (supabase) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) showToast(error.message, 'error');
        else showToast("Registration request initiated. Check email for confirmation links.");
    } else {
        mockSessionUser = { id: 'usr_sandbox', email: email };
        localStorage.setItem('mock_user', JSON.stringify(mockSessionUser));
        syncAuthenticatedUI(mockSessionUser);
        showToast("Sandbox account configuration completed.");
    }
}

async function handleGoogleOAuth() {
    if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
        if (error) showToast(error.message, 'error');
    } else {
        showToast("OAuth link initialized. Provide keys to run full Google verification pipeline.", "error");
    }
}

async function handleSignOut() {
    if (supabase) {
        await supabase.auth.signOut();
    } else {
        mockSessionUser = null;
        localStorage.removeItem('mock_user');
        syncDeauthenticatedUI();
        showToast("Session disconnected.");
    }
}

// --- FEATURE REWARDS ENGINE (BOOKLOOP ACTIONS) ---
async function handleSummarySubmission(e) {
    e.preventDefault();
    
    const summaryData = {
        title: DOM.bookTitle.value.trim(),
        author: DOM.bookAuthor.value.trim(),
        isbn: DOM.bookIsbn.value.trim(),
        category: DOM.bookCategory.value,
        summary: DOM.summaryText.value.trim(),
        created_at: new Date().toISOString()
    };
    
    // Check validation constraints (e.g. word count bounds check)
    if (summaryData.summary.split(/\s+/).length < 10) {
        showToast("Please provide a more robust descriptive summary to earn credits.", "error");
        return;
    }

    const userId = supabase ? (await supabase.auth.getUser()).data.user?.id : 'usr_sandbox';

    if (supabase) {
        try {
            const { error: dbErr } = await supabase.from('summaries').insert([{ 
                user_id: userId,
                title: summaryData.title,
                author: summaryData.author,
                isbn: summaryData.isbn,
                category: summaryData.category,
                summary_content: summaryData.summary
            }]);
            if (dbErr) throw dbErr;

            const nextBalance = parseFloat(appState.userProfile.balance) + 0.50;
            await supabase.from('profiles').update({ 
                balance: nextBalance,
                submissions_count: (appState.summaries.length + 1)
            }).eq('id', userId);
            
            showToast("Row saved successfully! Reward ledger balances adjusted by +$0.50.");
        } catch (err) {
            showToast("Database mapping failed: " + err.message, "error");
        }
    } else {
        appState.summaries.unshift(summaryData);
        appState.userProfile.balance = parseFloat(appState.userProfile.balance) + 0.50;
        localStorage.setItem(`logs_${userId}`, JSON.stringify(appState.summaries));
        localStorage.setItem(`profile_${userId}`, JSON.stringify(appState.userProfile));
        showToast("Sandbox Ledger updated: Balance increased by +$0.50.");
    }
    
    DOM.summaryForm.reset();
    updateDashboardMetrics();
    renderSummaryLog();
}

function executeBarcodeScannerSimulation() {
    showToast("Connecting hardware device cameras...");
    setTimeout(() => {
        DOM.bookTitle.value = "Introduction to Database Systems";
        DOM.bookAuthor.value = "C.J. Date";
        DOM.bookIsbn.value = "9780201543292";
        DOM.bookCategory.value = "Science & Tech";
        showToast("Barcode found: ISBN 9780201543292 auto-populated.");
    }, 1000);
}

function renderSummaryLog() {
    if (appState.summaries.length === 0) {
        DOM.submissionsList.innerHTML = `<div class="data-placeholder">No book summaries written yet. Complete the form above to build account records.</div>`;
        return;
    }
    DOM.submissionsList.innerHTML = appState.summaries.map(item => `
        <div class="log-item">
            <div class="log-header">
                <span>${escapeHtml(item.title)}</span>
                <span style="color:var(--accent-reward); font-weight:700;">+$0.50</span>
            </div>
            <div class="log-meta">by ${escapeHtml(item.author)} | ${escapeHtml(item.category)}</div>
        </div>
    `).join('');
}

// --- SCHOLARSHIP QUERY FILTER OPERATIONS ---
function renderScholarships() {
    const query = DOM.scholarshipSearch.value.toLowerCase();
    const floorFunding = parseFloat(DOM.filterFunding.value) || 0;
    const dateConstraint = DOM.filterDeadline.value;
    
    const results = appState.scholarships.filter(item => {
        const textMatch = item.name.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
        const fundMatch = item.amount >= floorFunding;
        
        let dateMatch = true;
        if (dateConstraint === 'upcoming') {
            const diff = (new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24);
            dateMatch = diff >= 0 && diff <= 10;
        }
        return textMatch && fundMatch && dateMatch;
    });
    
    if (results.length === 0) {
        DOM.scholarshipsList.innerHTML = `<div class="data-placeholder">No matching scholarship listings discovered. Try adjusting parameters.</div>`;
        return;
    }
    
    DOM.scholarshipsList.innerHTML = results.map(item => `
        <div class="scholarship-item-card">
            <div class="sch-header">
                <span>${escapeHtml(item.name)}</span>
                <span class="sch-amount">$${item.amount.toLocaleString()}</span>
            </div>
            <div class="sch-meta">${escapeHtml(item.provider)} | 📅 Deadline: ${item.deadline}</div>
            <p class="sch-desc">${escapeHtml(item.desc)}</p>
            <button onclick="executeSaveScholarshipSimulation(${item.id})" class="btn btn-outline" style="font-size:11px; padding:4px 8px; margin-top:10px;">
                🔖 Track Opportunity
            </button>
        </div>
    `).join('');
}

window.executeSaveScholarshipSimulation = function(id) {
    appState.userProfile.savedCount += 1;
    updateDashboardMetrics();
    showToast("Opportunity added to your tracking list.");
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
