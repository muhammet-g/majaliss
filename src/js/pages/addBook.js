/**
 * ملف صفحة إضافة كتاب جديد (addBook.js)
 * يسمح للمشرفين بإضافة كتب جديدة مع رفع صورة الغلاف إلى Supabase Storage
 */

import { supabase } from '../supabaseClient.js';
import Swal from 'sweetalert2';

/**
 * دالة عرض صفحة إضافة كتاب
 * @param {Object} currentUser - المستخدم الحالي
 */
function renderAddBookPage(currentUser) {
    // ✅ SECURITY CHECK: Only admins can access this page
    if (!currentUser || currentUser.role !== 'admin') {
        Swal.fire({
            title: 'غير مصرح',
            text: 'هذه الصفحة متاحة للمشرفين فقط',
            icon: 'error',
            confirmButtonText: 'حسناً',
            customClass: { confirmButton: 'btn-golden' },
            background: '#041E3B',
            color: '#E5E5E5'
        }).then(() => {
            window.location.hash = '#/';
        });
        return;
    }

    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="add-book-page">
            <div class="page-header">
                <h1 class="page-title">
                    <i class="bi bi-plus-circle"></i>
                    إضافة كتاب جديد
                </h1>
                <p class="page-subtitle">أضف كتاباً جديداً إلى المكتبة</p>
            </div>

            <div class="add-book-form-container">
                <form id="add-book-form" class="add-book-form">
                    
                    <!-- Title Input -->
                    <div class="form-group">
                        <label for="book-title" class="form-label">
                            <i class="bi bi-book"></i>
                            عنوان الكتاب <span class="required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="book-title" 
                            class="form-control" 
                            placeholder="أدخل عنوان الكتاب"
                            required
                        >
                    </div>

                    <!-- Author Input -->
                    <div class="form-group">
                        <label for="book-author" class="form-label">
                            <i class="bi bi-person"></i>
                            المؤلف <span class="required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="book-author" 
                            class="form-control" 
                            placeholder="أدخل اسم المؤلف"
                            required
                        >
                    </div>

                    <!-- Category Input -->
                    <div class="form-group">
                        <label for="book-category" class="form-label">
                            <i class="bi bi-tag"></i>
                            التصنيف <span class="required">*</span>
                        </label>
                        <select id="book-category" class="form-control" required>
                            <option value="">اختر التصنيف</option>
                            <option value="أدب">أدب</option>
                            <option value="تاريخ">تاريخ</option>
                            <option value="فلسفة">فلسفة</option>
                            <option value="علوم">علوم</option>
                            <option value="دين">دين</option>
                            <option value="سيرة">سيرة</option>
                            <option value="شعر">شعر</option>
                            <option value="أخرى">أخرى</option>
                        </select>
                    </div>

                    <!-- Description Input -->
                    <div class="form-group">
                        <label for="book-description" class="form-label">
                            <i class="bi bi-text-paragraph"></i>
                            الوصف <span class="required">*</span>
                        </label>
                        <textarea 
                            id="book-description" 
                            class="form-control" 
                            rows="4"
                            placeholder="أدخل وصف الكتاب"
                            required
                        ></textarea>
                    </div>

                    <!-- Status Selection -->
                    <div class="form-group">
                        <label for="book-status" class="form-label">
                            <i class="bi bi-flag"></i>
                            الحالة <span class="required">*</span>
                        </label>
                        <select id="book-status" class="form-control" required>
                            <option value="upcoming">قادم</option>
                            <option value="current">قيد القراءة</option>
                            <option value="read">مقروء</option>
                        </select>
                    </div>

                    <!-- Cover Image Upload -->
                    <div class="form-group">
                        <label for="cover-file" class="form-label">
                            <i class="bi bi-image"></i>
                            صورة الغلاف <span class="optional">(اختياري)</span>
                        </label>
                        <div class="file-input-wrapper">
                            <input 
                                type="file" 
                                id="cover-file" 
                                class="form-control file-input" 
                                accept="image/*"
                            >
                            <div class="file-input-info">
                                <i class="bi bi-cloud-upload"></i>
                                <span>اختر صورة الغلاف أو اسحبها هنا</span>
                                <small>JPG, PNG, GIF (حد أقصى 2MB)</small>
                            </div>
                        </div>
                        <div id="image-preview" class="image-preview" style="display: none;">
                            <img id="preview-img" src="" alt="معاينة">
                            <button type="button" id="remove-image" class="btn-remove-image">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Submit Buttons -->
                    <div class="form-actions">
                        <button type="submit" id="submit-book-btn" class="btn-golden">
                            <i class="bi bi-check-circle"></i>
                            إضافة الكتاب
                        </button>
                        <button type="button" id="cancel-btn" class="btn-secondary">
                            <i class="bi bi-x-circle"></i>
                            إلغاء
                        </button>
                    </div>

                </form>
            </div>
        </div>
    `;

    // Setup event listeners
    setupFormListeners();
}

/**
 * إعداد مستمعي أحداث النموذج
 */
function setupFormListeners() {
    const form = document.getElementById('add-book-form');
    const fileInput = document.getElementById('cover-file');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    const cancelBtn = document.getElementById('cancel-btn');

    // Handle file input change for image preview
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire({
                    title: 'حجم الملف كبير',
                    text: 'يرجى اختيار صورة أصغر من 2 ميجابايت',
                    icon: 'warning',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
                fileInput.value = '';
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle remove image button
    removeImageBtn.addEventListener('click', () => {
        fileInput.value = '';
        imagePreview.style.display = 'none';
        previewImg.src = '';
    });

    // Handle cancel button
    cancelBtn.addEventListener('click', () => {
        window.location.hash = '#/library';
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit();
    });
}

/**
 * معالجة إرسال النموذج وإضافة الكتاب
 */
async function handleFormSubmit() {
    // Get form data
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const category = document.getElementById('book-category').value;
    const description = document.getElementById('book-description').value.trim();
    const status = document.getElementById('book-status').value;
    const coverFile = document.getElementById('cover-file').files[0];

    // Validate required fields
    if (!title || !author || !category || !description) {
        Swal.fire({
            title: 'خطأ',
            text: 'يرجى ملء جميع الحقول المطلوبة',
            icon: 'error',
            confirmButtonText: 'حسناً',
            customClass: { confirmButton: 'btn-golden' },
            background: '#041E3B',
            color: '#E5E5E5'
        });
        return;
    }

    // Show loading
    Swal.fire({
        title: 'جاري إضافة الكتاب...',
        html: 'يرجى الانتظار',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        background: '#041E3B',
        color: '#E5E5E5'
    });

    try {
        let coverUrl = 'https://via.placeholder.com/400x600/041E3B/CD9B14?text=Book+Cover';

        // Upload image to Supabase Storage if provided
        if (coverFile) {
            coverUrl = await uploadCoverImage(coverFile);
        }

        // Insert book into database
        const { data, error } = await supabase
            .from('books')
            .insert([
                {
                    title: title,
                    author: author,
                    category: category,
                    description: description,
                    status: status,
                    cover_url: coverUrl
                }
            ])
            .select();

        if (error) {
            throw error;
        }

        // Success message
        Swal.fire({
            title: 'تم إضافة الكتاب!',
            text: 'تمت إضافة الكتاب بنجاح إلى المكتبة',
            icon: 'success',
            confirmButtonText: 'عودة للمكتبة',
            customClass: { confirmButton: 'btn-golden' },
            background: '#041E3B',
            color: '#E5E5E5'
        }).then(() => {
            // Redirect to library page
            window.location.hash = '#/library';
            // Reload page to refresh book list
            setTimeout(() => location.reload(), 500);
        });

    } catch (error) {
        console.error('Error adding book:', error);
        Swal.fire({
            title: 'خطأ',
            text: 'حدث خطأ أثناء إضافة الكتاب: ' + error.message,
            icon: 'error',
            confirmButtonText: 'حسناً',
            customClass: { confirmButton: 'btn-golden' },
            background: '#041E3B',
            color: '#E5E5E5'
        });
    }
}

/**
 * رفع صورة الغلاف إلى Supabase Storage
 * @param {File} file - ملف الصورة
 * @returns {Promise<string>} رابط الصورة العام
 */
async function uploadCoverImage(file) {
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from('covers')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('covers')
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Error uploading image:', error);
        // Return placeholder if upload fails
        return 'https://via.placeholder.com/400x600/041E3B/CD9B14?text=Book+Cover';
    }
}

export { renderAddBookPage };
