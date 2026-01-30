/**
 * ملف صفحة تفاصيل الكتاب (bookDetails.js)
 * يعرض معلومات تفصيلية عن كتاب محدد مع إمكانية التقييم والتعليق
 */

import { books } from '../data.js';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient.js';

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

            <!-- Reviews Section -->
            <section id="reviews-section" class="mt-5">
                <h2 class="section-title">
                    <i class="bi bi-star-fill"></i>
                    التقييمات والمراجعات
                </h2>

                <!-- Reviews Summary Card -->
                <div class="reviews-summary-card">
                    <div class="summary-content">
                        <div class="average-rating">
                            <span class="rating-number" id="average-rating-value">0.0</span>
                            <div class="rating-stars" id="average-rating-stars">
                                <i class="bi bi-star"></i>
                                <i class="bi bi-star"></i>
                                <i class="bi bi-star"></i>
                                <i class="bi bi-star"></i>
                                <i class="bi bi-star"></i>
                            </div>
                        </div>
                        <div class="total-reviews">
                            <span id="total-reviews-count">0</span> تقييم
                        </div>
                    </div>
                </div>

                <!-- Add Review Form (visible only to logged-in members) -->
                ${isActive ? `
                <div class="add-review-form mt-4">
                    <h4 class="form-title">
                        <i class="bi bi-pencil-square"></i>
                        اكتب تقييمك
                    </h4>
                    <div class="rating-input mb-3">
                        <label>التقييم:</label>
                        <div class="star-rating-input">
                            <i class="bi bi-star" data-rating="1"></i>
                            <i class="bi bi-star" data-rating="2"></i>
                            <i class="bi bi-star" data-rating="3"></i>
                            <i class="bi bi-star" data-rating="4"></i>
                            <i class="bi bi-star" data-rating="5"></i>
                        </div>
                    </div>
                    <div class="comment-input mb-3">
                        <label for="review-comment">التعليق:</label>
                        <textarea id="review-comment" class="form-control" rows="4" 
                            placeholder="شارك رأيك حول الكتاب..."></textarea>
                    </div>
                    <button id="submit-review-btn" class="btn-golden">
                        <i class="bi bi-send"></i>
                        إرسال التقييم
                    </button>
                </div>
                ` : `
                <div class="locked-review-form text-center mt-4">
                    <i class="bi bi-lock-fill"></i>
                    <p>يجب تسجيل الدخول لإضافة تقييم</p>
                </div>
                `}

                <!-- Reviews List Container -->
                <div class="reviews-list mt-5">
                    <h4 class="list-title">
                        <i class="bi bi-chat-left-text"></i>
                        جميع التقييمات
                    </h4>
                    <div id="reviews-container">
                        <!-- Reviews will be loaded here dynamically -->
                        <div class="loading-reviews text-center">
                            <div class="spinner-border text-warning" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // إعداد المستمعين التفاعليين إذا كان المستخدم نشطاً
    if (isActive) {
        setupInteractiveListeners();
    }

    // Load reviews for this book
    loadReviews(bookId);

    // Setup review form listeners if user is active
    if (isActive) {
        setupReviewFormListeners(bookId, currentUser);
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

/**
 * دالة تحميل التقييمات من قاعدة البيانات
 * @param {number} bookId - معرف الكتاب
 */
async function loadReviews(bookId) {
    try {
        // Fetch reviews from Supabase
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('book_id', bookId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reviews:', error);
            displayNoReviews();
            return;
        }

        // Calculate average rating
        if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = (totalRating / reviews.length).toFixed(1);

            // Update summary card
            document.getElementById('average-rating-value').textContent = averageRating;
            document.getElementById('total-reviews-count').textContent = reviews.length;

            // Update average rating stars
            updateAverageStars(parseFloat(averageRating));

            // Render reviews
            renderReviews(reviews);
        } else {
            displayNoReviews();
        }
    } catch (error) {
        console.error('Error in loadReviews:', error);
        displayNoReviews();
    }
}

/**
 * دالة تحديث نجوم المتوسط في بطاقة الملخص
 * @param {number} rating - التقييم المتوسط
 */
function updateAverageStars(rating) {
    const starsContainer = document.getElementById('average-rating-stars');
    const stars = starsContainer.querySelectorAll('i');

    stars.forEach((star, index) => {
        star.classList.remove('bi-star', 'bi-star-fill', 'bi-star-half');

        if (index < Math.floor(rating)) {
            star.classList.add('bi-star-fill');
        } else if (index < rating) {
            star.classList.add('bi-star-half');
        } else {
            star.classList.add('bi-star');
        }
    });
}

/**
 * دالة عرض التقييمات في القائمة
 * @param {Array} reviews - مصفوفة التقييمات
 */
function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');

    if (!reviews || reviews.length === 0) {
        displayNoReviews();
        return;
    }

    container.innerHTML = reviews.map(review => {
        const date = new Date(review.created_at).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="reviewer-details">
                            <h5 class="reviewer-name">${review.member_email}</h5>
                            <div class="review-rating">
                                ${generateStars(review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="review-date">${date}</div>
                </div>
                <div class="review-body">
                    <p class="review-comment">${review.comment}</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * دالة توليد نجوم التقييم (HTML)
 * @param {number} rating - التقييم (1-5)
 * @returns {string} HTML للنجوم
 */
function generateStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="bi bi-star-fill"></i>';
        } else {
            starsHtml += '<i class="bi bi-star"></i>';
        }
    }
    return starsHtml;
}

/**
 * دالة عرض رسالة "لا توجد تقييمات"
 */
function displayNoReviews() {
    const container = document.getElementById('reviews-container');
    container.innerHTML = `
        <div class="no-reviews text-center">
            <i class="bi bi-chat-left-dots"></i>
            <p>لا توجد تقييمات حتى الآن. كن أول من يقيم هذا الكتاب!</p>
        </div>
    `;

    // Reset summary card
    document.getElementById('average-rating-value').textContent = '0.0';
    document.getElementById('total-reviews-count').textContent = '0';
    updateAverageStars(0);
}

/**
 * دالة إعداد مستمعي أحداث نموذج التقييم
 * @param {number} bookId - معرف الكتاب
 * @param {Object} currentUser - المستخدم الحالي
 */
function setupReviewFormListeners(bookId, currentUser) {
    let selectedRating = 0;
    const stars = document.querySelectorAll('.star-rating-input i');

    // Handle star rating selection
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            updateFormStars(selectedRating);
        });

        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            updateFormStars(rating);
        });
    });

    document.querySelector('.star-rating-input').addEventListener('mouseleave', () => {
        updateFormStars(selectedRating);
    });

    function updateFormStars(rating) {
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

    // Handle review submission
    document.getElementById('submit-review-btn').addEventListener('click', async () => {
        const comment = document.getElementById('review-comment').value.trim();

        // Validation
        if (selectedRating === 0) {
            Swal.fire({
                title: 'تنبيه',
                text: 'يرجى اختيار تقييم من النجوم',
                icon: 'warning',
                confirmButtonText: 'حسناً',
                customClass: { confirmButton: 'btn-golden' },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return;
        }

        if (!comment) {
            Swal.fire({
                title: 'تنبيه',
                text: 'يرجى كتابة تعليق',
                icon: 'warning',
                confirmButtonText: 'حسناً',
                customClass: { confirmButton: 'btn-golden' },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return;
        }

        // Show loading
        Swal.fire({
            title: 'جاري الإرسال...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#041E3B',
            color: '#E5E5E5'
        });

        try {
            // Insert review into Supabase
            const { data, error } = await supabase
                .from('reviews')
                .insert([
                    {
                        book_id: bookId,
                        member_email: currentUser.email,
                        rating: selectedRating,
                        comment: comment
                    }
                ]);

            if (error) {
                throw error;
            }

            // Success message
            Swal.fire({
                title: 'تم إرسال تقييمك!',
                text: 'شكراً لمشاركتك',
                icon: 'success',
                confirmButtonText: 'حسناً',
                customClass: { confirmButton: 'btn-golden' },
                background: '#041E3B',
                color: '#E5E5E5'
            });

            // Clear form
            document.getElementById('review-comment').value = '';
            selectedRating = 0;
            updateFormStars(0);

            // Reload reviews
            loadReviews(bookId);

        } catch (error) {
            console.error('Error submitting review:', error);
            Swal.fire({
                title: 'خطأ',
                text: 'حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.',
                icon: 'error',
                confirmButtonText: 'حسناً',
                customClass: { confirmButton: 'btn-golden' },
                background: '#041E3B',
                color: '#E5E5E5'
            });
        }
    });
}

export { renderBookDetailsPage };
