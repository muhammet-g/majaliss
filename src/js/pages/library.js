/**
 * ملف صفحة المكتبة (library.js)
 * يعرض جميع الكتب المتاحة في مكتبة النادي
 */

import { books } from '../data.js';

/**
 * دالة عرض صفحة المكتبة
 * @param {Object} currentUser - المستخدم الحالي (يحدد إذا كان الوصول مسموحاً)
 */
function renderLibraryPage(currentUser) {
    const contentArea = document.getElementById('contentArea');

    // بناء HTML لكل كتاب
    const booksHTML = books.map(book => {
        const statusBadge = getStatusBadge(book.status); // الحصول على شارة الحالة
        const isLocked = !currentUser || currentUser.status !== 'active'; // التحقق من صلاحية الوصول

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="book-card ${isLocked ? 'locked' : ''}" data-book-id="${book.id}">
                    ${isLocked ? '<div class="lock-overlay"><i class="bi bi-lock-fill"></i></div>' : ''}
                    <img src="${book.coverImage}" class="book-cover-img" alt="${book.title}">
                    <div class="book-card-body">
                        <h5 class="book-title">${book.title}</h5>
                        ${statusBadge}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contentArea.innerHTML = `
        <div class="library-page">
            <h2 class="page-title text-center mb-5">
                <i class="bi bi-book"></i>
                مكتبة النادي
            </h2>
            
            <div class="row">
                ${booksHTML}
            </div>
        </div>
    `;

    // إضافة مستمعي الأحداث على بطاقات الكتب
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            const bookId = card.getAttribute('data-book-id');
            // السماح بالنقر فقط على الكتب غير المقفلة
            if (!card.classList.contains('locked')) {
                window.location.hash = `#/book/${bookId}`; // الانتقال لصفحة تفاصيل الكتاب
            }
        });
    });
}

/**
 * دالة الحصول على شارة حالة الكتاب
 * @param {string} status - حالة الكتاب (read, current, upcoming)
 * @returns {string} HTML للشارة
 */
function getStatusBadge(status) {
    const badges = {
        'read': '<span class="badge badge-read">مقروء</span>',
        'current': '<span class="badge badge-current">قيد القراءة</span>',
        'upcoming': '<span class="badge badge-upcoming">قادم</span>'
    };
    return badges[status] || '';
}

export { renderLibraryPage };
