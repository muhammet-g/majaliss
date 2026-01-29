/**
 * ملف صفحة تفاصيل الكتاب (bookDetails.js)
 * يعرض معلومات تفصيلية عن كتاب محدد مع إمكانية التقييم والتعليق
 */

import { books } from '../data.js';
import Swal from 'sweetalert2';

/**
 * دالة عرض صفحة تفاصيل الكتاب
 * @param {Array} params - معاملات URL (تحتوي على معرف الكتاب)
 * @param {Object} currentUser - المستخدم الحالي
 */
function renderBookDetailsPage(params, currentUser) {
    const bookId = params[0]; // الحصول على معرف الكتاب من المعاملات
    const book = books.find(b => b.id === parseInt(bookId)); // البحث عن الكتاب

    // التحقق من وجود الكتاب
    if (!book) {
        document.getElementById('contentArea').innerHTML = `
            <div class="text-center">
                <h2>الكتاب غير موجود</h2>
                <button onclick="window.location.hash='#/library'" class="btn-golden mt-3">عودة للمكتبة</button>
            </div>
        `;
        return;
    }

    // التحقق من أن المستخدم عضو نشط
    const isActive = currentUser && currentUser.status === 'active';

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="book-details-page">
            <div class="row">
                <div class="col-md-4">
                    <img src="${book.coverImage}" class="book-detail-cover" alt="${book.title}">
                </div>
                <div class="col-md-8">
                    <h1 class="book-detail-title">${book.title}</h1>
                    <div class="book-meta">
                        <span class="badge ${book.status === 'read' ? 'badge-read' : 'badge-upcoming'}">
                            ${book.status === 'read' ? 'مقروء' : 'قادم'}
                        </span>
                    </div>
                    
                    <div class="book-description mt-4">
                        <p>
                            هذا الكتاب من الكتب المميزة في مكتبة مجالس الوراقين. 
                            انضم إلى النقاشات الحية مع الأعضاء الآخرين لتبادل الآراء والأفكار.
                        </p>
                    </div>

                    <!-- Interactive Zone -->
                    <div class="interactive-zone mt-5">
                        <h3 class="zone-title">
                            <i class="bi bi-chat-dots"></i>
                            منطقة التفاعل
                        </h3>
                        
                        ${isActive ? renderInteractiveContent() : renderLockedContent()}
                    </div>
                </div>
            </div>
        </div>
    `;

    // إعداد المستمعين التفاعليين إذا كان المستخدم نشطاً
    if (isActive) {
        setupInteractiveListeners();
    }
}

/**
 * دالة عرض المحتوى التفاعلي (التقييم والتعليقات)
 * متاحة فقط للأعضاء النشطين
 * @returns {string} HTML للمحتوى التفاعلي
 */
function renderInteractiveContent() {
    return `
        <div class="rating-section mb-4">
            <label>تقييمك للكتاب:</label>
            <div class="star-rating">
                <i class="bi bi-star" data-rating="1"></i>
                <i class="bi bi-star" data-rating="2"></i>
                <i class="bi bi-star" data-rating="3"></i>
                <i class="bi bi-star" data-rating="4"></i>
                <i class="bi bi-star" data-rating="5"></i>
            </div>
        </div>
        
        <div class="comment-section">
            <label for="commentBox">شارك رأيك:</label>
            <textarea id="commentBox" class="form-control comment-box" rows="4" 
                placeholder="اكتب تعليقك هنا..."></textarea>
            <button id="submitComment" class="btn-golden mt-3">
                <i class="bi bi-send"></i>
                إرسال التعليق
            </button>
        </div>
    `;
}

/**
 * دالة عرض المحتوى المقفل
 * تظهر للمستخدمين غير المصرح لهم
 * @returns {string} HTML للمحتوى المقفل
 */
function renderLockedContent() {
    return `
        <div class="locked-content text-center">
            <i class="bi bi-lock-fill locked-icon"></i>
            <h4>محتوى محظور</h4>
            <p>يجب أن تكون عضواً نشطاً للوصول إلى منطقة التفاعل</p>
            <button class="btn-golden" onclick="window.location.hash='#/'">
                اطلب العضوية
            </button>
        </div>
    `;
}

/**
 * دالة إعداد مستمعي الأحداث للمكونات التفاعلية
 * تتعامل مع نظام التقييم بالنجوم وإرسال التعليقات
 */
function setupInteractiveListeners() {
    // نظام التقييم بالنجوم
    const stars = document.querySelectorAll('.star-rating i');
    let selectedRating = 0; // التقييم المختار

    stars.forEach(star => {
        // عند النقر على نجمة: حفظ التقييم
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            updateStars(selectedRating);
        });

        // عند تمرير الماوس: عرض التقييم المحتمل
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            updateStars(rating);
        });
    });

    // عند مغادرة الماوس: العودة للتقييم المحفوظ
    document.querySelector('.star-rating').addEventListener('mouseleave', () => {
        updateStars(selectedRating);
    });

    /**
     * دالة تحديث شكل النجوم حسب التقييم
     * @param {number} rating - التقييم (1-5)
     */
    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('bi-star');
                star.classList.add('bi-star-fill');
            } else {
                star.classList.remove('bi-star-fill');
                star.classList.add('bi-star');
            }
        });
    }

    // معالج إرسال التعليق
    document.getElementById('submitComment').addEventListener('click', () => {
        const comment = document.getElementById('commentBox').value;

        // التحقق من أن التعليق غير فارغ
        if (!comment.trim()) {
            Swal.fire({
                title: 'تنبيه',
                text: 'يرجى كتابة تعليق أولاً',
                icon: 'warning',
                confirmButtonText: 'حسناً',
                customClass: { confirmButton: 'btn-golden' },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return;
        }

        Swal.fire({
            title: 'تم إرسال تعليقك!',
            text: 'شكراً لمشاركتك',
            icon: 'success',
            confirmButtonText: 'حسناً',
            customClass: { confirmButton: 'btn-golden' },
            background: '#041E3B',
            color: '#E5E5E5'
        });

        document.getElementById('commentBox').value = '';
    });
}

export { renderBookDetailsPage };
