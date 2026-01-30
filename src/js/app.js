/**
 * ملف التطبيق الرئيسي (app.js)
 * نقطة البداية للتطبيق، يحتوي على إعدادات الموجه والمسارات
 */

// استيراد المكتبات الخارجية
import 'bootstrap'; // مكتبة Bootstrap للتصميم
import '../scss/main.scss'; // ملف الأنماط الرئيسي
import Swal from 'sweetalert2';

// استيراد الموجه والخدمات
import Router from './router.js';
import { fetchBooks, fetchMembers, getMemberStatus } from './services.js';
import { supabase } from './supabaseClient.js';
import { isLoggedIn, getLoggedUser, updateNavbarByRole } from './auth.js';

// استيراد دوال عرض الصفحات
import { renderHomePage } from './pages/home.js';
import { renderLibraryPage } from './pages/library.js';
import { renderBookDetailsPage } from './pages/bookDetails.js';
import { renderAdminPage } from './pages/admin.js';
import { renderAddBookPage } from './pages/addBook.js';

// Global state for shared data
let globalBooks = [];
let globalMembers = [];
let currentUser = null;

/**
 * Show loading spinner
 */
function showLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

/**
 * Initialize app data from Supabase
 */
async function initializeAppData() {
    showLoadingSpinner();

    try {
        // Check authentication status first
        const { data: { session } } = await supabase.auth.getSession();
        const hasValidSession = session?.user?.id;

        // Always fetch books (public data)
        try {
            globalBooks = await fetchBooks();
            console.log('✅ Books loaded successfully');
        } catch (booksError) {
            console.warn('⚠️ Failed to load books:', booksError);
            globalBooks = []; // Continue with empty books array
        }

        // Only fetch members if user has a valid session (protected data)
        if (hasValidSession) {
            try {
                globalMembers = await fetchMembers();
                console.log('✅ Members loaded successfully');
            } catch (membersError) {
                console.warn('⚠️ Failed to load members:', membersError);
                globalMembers = []; // Continue with empty members array
            }
        } else {
            globalMembers = []; // No session, skip members
            console.log('ℹ️ Skipping members fetch (no active session)');
        }

        // Check if user is logged in from localStorage
        if (isLoggedIn()) {
            currentUser = getLoggedUser();
            console.log('✅ User logged in:', currentUser.name);
        } else {
            // No logged-in user
            currentUser = null;
            console.log('No user logged in');
        }

        hideLoadingSpinner();
        initializeRouter();
    } catch (error) {
        hideLoadingSpinner();
        console.error('Failed to initialize app:', error);

        // Initialize router anyway to show UI
        globalBooks = [];
        globalMembers = [];
        currentUser = null;
        initializeRouter();

        // Show error but don't block the app
        console.warn('⚠️ App initialized with limited functionality');
    }
}

/**
 * Initialize router with routes
 */
function initializeRouter() {
    const router = new Router();

    // Register all application routes
    router.register('/', () => renderHomePage(globalBooks, globalMembers, currentUser));
    router.register('/library', () => renderLibraryPage(currentUser, globalBooks));
    router.register('/book', (params) => renderBookDetailsPage(params, currentUser, globalBooks));
    router.register('/admin', () => renderAdminPage(currentUser, globalMembers));
    router.register('/add-book', () => renderAddBookPage(currentUser));

    // Update active nav link on route change
    window.addEventListener('hashchange', updateActiveNavLink);
    updateActiveNavLink();
}

/**
 * Update active nav link in navigation bar
 */
function updateActiveNavLink() {
    const hash = window.location.hash.slice(1) || '/';
    const [path] = hash.split('/').filter(Boolean);
    const route = path ? `/${path}` : '/';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${route}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Update UI based on login status
 * Show login button when not logged in, member area when logged in
 */
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const memberArea = document.getElementById('member-area');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    if (isLoggedIn()) {
        const user = getLoggedUser();
        loginBtn.style.display = 'none';
        memberArea.style.display = 'flex';
        userName.textContent = user.name;

        // تحديث شريط التنقل بناءً على دور المستخدم
        updateNavbarByRole(user);
    } else {
        loginBtn.style.display = 'block';
        memberArea.style.display = 'none';

        // إخفاء عناصر الإدارة للضيوف
        updateNavbarByRole(null);
    }
}

/**
 * Setup authentication event listeners
 */
function setupAuthListeners() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const { showLoginForm, loginUser } = await import('./auth.js');
            const user = await showLoginForm();
            if (user) {
                updateAuthUI();
                // Reload to update currentUser
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const { logoutUser } = import('./auth.js').then(m => m.logoutUser());
        });
    }
}

/**
 * 🧪 TEMPORARY TEST FUNCTION - Check Supabase Connection
 * This function tests the Supabase connection and logs results to console
 * Remove this function once connection is verified
 */
async function testSupabaseConnection() {
    console.group('🧪 SUPABASE CONNECTION TEST');

    try {
        // ✅ Test 1: Verify environment variables are loaded
        console.log('📍 Test 1: Checking environment variables...');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
            console.log('✅ Environment variables loaded successfully');
            console.log(`   - SUPABASE_URL: ${supabaseUrl.substring(0, 20)}...`);
            console.log(`   - SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);
        } else {
            console.error('❌ Environment variables NOT loaded');
            console.error('   Please check your .env file');
            return;
        }

        // ✅ Test 2: Fetch first book from books table
        console.log('\n📍 Test 2: Fetching first book from "books" table...');
        const { data: booksData, error: booksError } = await supabase
            .from('books')
            .select('*')
            .limit(1);

        if (booksError) {
            console.error('❌ Failed to fetch books:', booksError.message);
        } else if (booksData && booksData.length > 0) {
            console.log('✅ Successfully fetched book data:');
            console.table(booksData[0]);
        } else {
            console.warn('⚠️ No books found in the database');
        }

        // ✅ Test 3: Check if user with email exists
        console.log('\n📍 Test 3: Checking user profile by email (malahmd642@gmail.com)...');
        const userEmail = 'malahmd642@gmail.com';
        const memberStatus = await getMemberStatus(userEmail);

        if (memberStatus) {
            console.log('✅ User profile found:');
            console.table(memberStatus);
        } else {
            console.warn('⚠️ No user found with email:', userEmail);
            console.info('   Tip: You may need to add this user to the members table first');
        }

        // ✅ Test 4: Fetch all members count
        console.log('\n📍 Test 4: Fetching all members from "members" table...');
        const { data: membersData, error: membersError } = await supabase
            .from('members')
            .select('count');

        if (membersError) {
            console.error('❌ Failed to fetch members count:', membersError.message);
        } else {
            console.log('✅ Members table is accessible');
            console.log(`   Total members in database: ${membersData?.length || 0}`);
        }

        // ✅ Final Result
        console.log('\n');
        console.log('%c✅ CONNECTION TEST COMPLETED SUCCESSFULLY', 'color: #28a745; font-size: 14px; font-weight: bold;');
        console.log('Your Supabase connection is working correctly!');

    } catch (error) {
        console.error('%c❌ CONNECTION TEST FAILED', 'color: #dc3545; font-size: 14px; font-weight: bold;');
        console.error('Error:', error);
    }

    console.groupEnd();
}

/**
 * Main function - runs when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // 🧪 Run connection test immediately
    testSupabaseConnection();

    // Then initialize the app
    initializeAppData().then(() => {
        // Setup auth UI and listeners after app initialization
        updateAuthUI();
        setupAuthListeners();
    });
});
