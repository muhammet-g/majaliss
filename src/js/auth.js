/**
 * ملف المصادقة والتسجيل (auth.js)
 * يتعامل مع تسجيل الدخول والخروج وإدارة حالة المستخدم
 */

import Swal from 'sweetalert2';
import { supabase } from './supabaseClient.js';

/**
 * جلب بيانات المستخدم من Supabase بناءً على البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني للمستخدم
 * @returns {Promise<Object|null>} بيانات المستخدم أو null
 */
async function getUserByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found
            throw new Error(`خطأ في البحث: ${error.message}`);
        }

        return data || null;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
}

/**
 * تسجيل دخول المستخدم
 * @param {string} email - البريد الإلكتروني
 * @returns {Promise<Object|null>} بيانات المستخدم إذا نجح التسجيل
 */
export async function loginUser(email) {
    try {
        // البحث عن المستخدم في قاعدة البيانات
        const user = await getUserByEmail(email);

        if (!user) {
            // المستخدم غير موجود
            Swal.fire({
                icon: 'error',
                title: 'بريد غير مسجل',
                text: 'هذا البريد الإلكتروني غير مسجل في النظام',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'btn-golden'
                },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return null;
        }

        // التحقق من حالة المستخدم
        if (user.status === 'pending') {
            // المستخدم قيد الانتظار
            Swal.fire({
                icon: 'warning',
                title: 'طلب قيد المراجعة',
                text: 'طلب الانضمام الخاص بك قيد المراجعة من قبل الإدارة. سيتم إخطارك عند قبول طلبك.',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'btn-secondary'
                },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return null;
        }

        if (user.status !== 'active') {
            // حالة غير معروفة
            Swal.fire({
                icon: 'error',
                title: 'حساب معطل',
                text: 'حسابك معطل حالياً. يرجى التواصل مع الإدارة.',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'btn-danger'
                },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return null;
        }

        // المستخدم نشط - حفظ في localStorage
        localStorage.setItem('loggedUser', JSON.stringify(user));
        console.log('✅ تم تسجيل الدخول بنجاح:', user.name);

        Swal.fire({
            icon: 'success',
            title: 'مرحباً!',
            text: `أهلاً وسهلاً ${user.name}`,
            confirmButtonText: 'متابعة',
            customClass: {
                confirmButton: 'btn-golden'
            },
            background: '#041E3B',
            color: '#E5E5E5',
            timer: 2000,
            timerProgressBar: true
        });

        return user;
    } catch (error) {
        console.error('Error during login:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ في تسجيل الدخول',
            text: 'حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.',
            confirmButtonText: 'حسناً',
            customClass: {
                confirmButton: 'btn-danger'
            },
            background: '#041E3B',
            color: '#E5E5E5'
        });
        return null;
    }
}

/**
 * تسجيل خروج المستخدم
 * مسح بيانات المستخدم من localStorage
 */
export function logoutUser() {
    const user = getLoggedUser();

    if (user) {
        Swal.fire({
            icon: 'question',
            title: 'تأكيد تسجيل الخروج',
            text: `هل تريد تسجيل الخروج يا ${user.name}؟`,
            showCancelButton: true,
            confirmButtonText: 'نعم، خروج',
            cancelButtonText: 'إلغاء',
            customClass: {
                confirmButton: 'btn-danger',
                cancelButton: 'btn-secondary'
            },
            background: '#041E3B',
            color: '#E5E5E5'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('loggedUser');
                console.log('✅ تم تسجيل الخروج');

                Swal.fire({
                    icon: 'success',
                    title: 'تم تسجيل الخروج',
                    text: 'شكراً لك على الزيارة',
                    confirmButtonText: 'حسناً',
                    customClass: {
                        confirmButton: 'btn-golden'
                    },
                    background: '#041E3B',
                    color: '#E5E5E5',
                    timer: 1500,
                    timerProgressBar: true
                }).then(() => {
                    // إعادة توجيه للصفحة الرئيسية
                    window.location.hash = '#/';
                    location.reload();
                });
            }
        });
    } else {
        console.warn('No user logged in');
    }
}

/**
 * الحصول على بيانات المستخدم المسجل حالياً
 * @returns {Object|null} بيانات المستخدم أو null
 */
export function getLoggedUser() {
    const userJson = localStorage.getItem('loggedUser');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * التحقق من حالة تسجيل الدخول
 * @returns {boolean} true إذا كان المستخدم مسجلاً
 */
export function isLoggedIn() {
    return getLoggedUser() !== null;
}

/**
 * تحديث بيانات المستخدم المسجل
 * مفيد عند تغيير البيانات من قاعدة البيانات
 * @param {Object} updatedUser - البيانات المحدثة
 */
export function updateLoggedUser(updatedUser) {
    localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
    console.log('✅ تم تحديث بيانات المستخدم');
}

/**
 * عرض نموذج تسجيل الدخول
 * استخدام SweetAlert2 لجمع البريد الإلكتروني
 */
export async function showLoginForm() {
    const { value: email } = await Swal.fire({
        title: 'تسجيل الدخول',
        input: 'email',
        inputLabel: 'أدخل بريدك الإلكتروني',
        inputPlaceholder: 'example@example.com',
        showCancelButton: true,
        confirmButtonText: 'دخول',
        cancelButtonText: 'إلغاء',
        customClass: {
            confirmButton: 'btn-golden',
            cancelButton: 'btn-secondary'
        },
        background: '#041E3B',
        color: '#E5E5E5',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off',
            dir: 'ltr'
        }
    });

    if (email) {
        // تحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'error',
                title: 'بريد غير صحيح',
                text: 'يرجى إدخال بريد إلكتروني صحيح',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'btn-danger'
                },
                background: '#041E3B',
                color: '#E5E5E5'
            });
            return null;
        }

        // محاولة تسجيل الدخول
        return await loginUser(email);
    }

    return null;
}
