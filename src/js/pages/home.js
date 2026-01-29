/**
 * ملف صفحة الرئيسية (home.js)
 * يحتوي على دوال عرض الصفحة الرئيسية ونموذج الانضمام
 */

import Swal from 'sweetalert2';
import { submitJoinRequest } from '../services.js';

/**
 * دالة عرض الصفحة الرئيسية
 * تعرض القسم البطولي، معلومات عن النادي، وزر الانضمام
 */
function renderHomePage() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="home-page">
            <!-- Hero Section -->
            <section class="hero-section text-center">
                <div class="book-3d-container">
                    <div class="book-3d">
                        <div class="book-cover">
                            <h2>مجالس<br>الوراقين</h2>
                        </div>
                    </div>
                </div>
                <h1 class="hero-title">مجالس الوراقين</h1>
                <p class="hero-subtitle">نادي النخبة للقراءة ومناقشة أمهات الكتب</p>
            </section>

            <!-- About Section -->
            <section class="about-section mt-5">
                <div class="row">
                    <div class="col-md-8 mx-auto">
                        <h2 class="section-title text-center mb-4">عن النادي</h2>
                        <div class="luxury-card">
                            <p class="luxury-text">
                                نحن مجموعة من عشاق القراءة والباحثين عن المعرفة، نجتمع لنناقش أعظم الكتب
                                في التراث العربي والعالمي. ننظم جلسات أسبوعية لمناقشة الكتب، ونتبادل
                                الآراء والأفكار في جو من الاحترام المتبادل والشغف بالمعرفة.
                            </p>
                            <div class="features mt-4">
                                <div class="feature-item">
                                    <i class="bi bi-book-fill"></i>
                                    <span>مكتبة متنوعة</span>
                                </div>
                                <div class="feature-item">
                                    <i class="bi bi-people-fill"></i>
                                    <span>نقاشات ثرية</span>
                                </div>
                                <div class="feature-item">
                                    <i class="bi bi-star-fill"></i>
                                    <span>بيئة راقية</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Call to Action -->
            <section class="cta-section text-center mt-5">
                <h3 class="mb-4">هل أنت مستعد للانضمام؟</h3>
                <button id="ctaJoinButton" class="btn-golden btn-lg">انضم إلينا الآن</button>
            </section>
        </div>
    `;

    // Add event listener for the CTA button
    document.getElementById('ctaJoinButton').addEventListener('click', showJoinForm);
}

function showJoinForm() {
    const steps = ['1', '2', '3', '4']; // خطوات النموذج الأربع

    // إعداد SweetAlert2 بإعدادات مخصصة للنموذج
    const swalQueueStep = Swal.mixin({
        confirmButtonText: 'التالي',
        cancelButtonText: 'رجوع',
        showCancelButton: true,
        progressSteps: steps, // عرض مؤشر التقدم
        customClass: {
            confirmButton: 'btn-golden',
            cancelButton: 'btn-secondary'
        },
        background: '#041E3B', // خلفية داكنة
        color: '#E5E5E5' // لون النص
    });

    const values = []; // مصفوفة لتخزين قيم النموذج

    // الخطوة الأولى: طلب الاسم الكامل
    swalQueueStep.fire({
        title: 'الاسم الكامل',
        input: 'text',
        inputPlaceholder: 'أدخل اسمك الكامل',
        currentProgressStep: 0, // الخطوة الأولى
        showCancelButton: false, // إخفاء زر الإلغاء في الخطوة الأولى
        inputValidator: (value) => {
            // التحقق من صحة الإدخال
            if (!value) {
                return 'يرجى إدخال اسمك';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            values[0] = result.value; // حفظ الاسم

            // الخطوة الثانية: طلب البريد الإلكتروني
            return swalQueueStep.fire({
                title: 'البريد الإلكتروني',
                input: 'email',
                inputPlaceholder: 'example@email.com',
                currentProgressStep: 1, // الخطوة الثانية
                inputValidator: (value) => {
                    if (!value) {
                        return 'يرجى إدخال بريدك الإلكتروني';
                    }
                }
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            values[1] = result.value; // حفظ البريد الإلكتروني

            // الخطوة الثالثة: طلب رقم الهاتف
            return swalQueueStep.fire({
                title: 'رقم الهاتف',
                input: 'tel',
                inputPlaceholder: '05xxxxxxxx',
                currentProgressStep: 2, // الخطوة الثالثة
                inputValidator: (value) => {
                    // التحقق من صحة رقم الهاتف
                    if (!value) {
                        return 'يرجى إدخال رقم هاتفك';
                    }
                    if (value.length < 10) {
                        return 'يرجى إدخال رقم هاتف صحيح';
                    }
                }
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            values[2] = result.value; // حفظ رقم الهاتف

            // الخطوة الرابعة: طلب سبب الانضمام
            return swalQueueStep.fire({
                title: 'لماذا تريد الانضمام؟',
                input: 'textarea',
                inputPlaceholder: 'أخبرنا عن شغفك بالقراءة...',
                currentProgressStep: 3, // الخطوة الرابعة والأخيرة
                confirmButtonText: 'إرسال الطلب',
                inputValidator: (value) => {
                    // التحقق من أن النص لا يقل عن 20 حرفاً
                    if (!value || value.length < 20) {
                        return 'يرجى كتابة 20 حرفاً على الأقل';
                    }
                }
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            values[3] = result.value; // حفظ سبب الانضمام

            // إرسال البيانات إلى قاعدة البيانات
            submitMembershipRequest(values);
        }
    });
}

/**
 * إرسال طلب الانضمام إلى قاعدة البيانات
 * @param {Array} values - مصفوفة تحتوي على [الاسم، البريد، الهاتف، السبب]
 */
async function submitMembershipRequest(values) {
    const memberData = {
        name: values[0],
        email: values[1],
        phone: values[2],
        reason: values[3]
    };

    try {
        // عرض رسالة انتظار
        Swal.fire({
            title: 'جاري معالجة طلبك...',
            html: 'يرجى الانتظار',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                confirmButton: 'btn-golden'
            },
            background: '#041E3B',
            color: '#E5E5E5'
        });

        // إرسال البيانات إلى Supabase
        const result = await submitJoinRequest(memberData);

        if (result) {
            // عرض رسالة النجاح
            Swal.fire({
                title: 'تم إرسال طلبك!',
                html: `
                    <p>شكراً لك يا <strong>${values[0]}</strong></p>
                    <p>تم استقبال طلب الانضمام الخاص بك بنجاح!</p>
                    <p>سيتم مراجعة طلبك من قبل الإدارة</p>
                    <p>سنتواصل معك على:</p>
                    <p><strong>${values[1]}</strong></p>
                    <p style="color: #CD9B14; margin-top: 10px;">
                        <i class="bi bi-info-circle"></i>
                        قد يستغرق قبول الطلب من يوم إلى ثلاثة أيام
                    </p>
                `,
                icon: 'success',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'btn-golden'
                },
                background: '#041E3B',
                color: '#E5E5E5'
            });

            console.log('✅ تم إرسال طلب الانضمام بنجاح:', result);
        }
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب:', error);

        // عرض رسالة خطأ
        Swal.fire({
            title: 'حدث خطأ',
            text: 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.',
            icon: 'error',
            confirmButtonText: 'حسناً',
            customClass: {
                confirmButton: 'btn-danger'
            },
            background: '#041E3B',
            color: '#E5E5E5'
        });
    }
}

export { renderHomePage, showJoinForm };
