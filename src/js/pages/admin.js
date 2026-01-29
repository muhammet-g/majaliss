/**
 * ملف لوحة التحكم الإدارية (admin.js)
 * يتيح للمشرفين إدارة طلبات العضوية
 */

import Swal from 'sweetalert2';
import { adminApproveMember, adminRejectMember, fetchMembers } from '../services.js';

/**
 * دالة عرض صفحة لوحة التحكم
 * متاحة فقط للمشرفين
 * @param {Object} currentUser - المستخدم الحالي
 * @param {Array} members - قائمة الأعضاء
 */
function renderAdminPage(currentUser, members) {
    // التحقق من أن المستخدم مشرف
    if (!currentUser || currentUser.role !== 'admin') {
        document.getElementById('contentArea').innerHTML = `
            <div class="text-center">
                <i class="bi bi-shield-lock-fill" style="font-size: 4rem; color: #CD9B14;"></i>
                <h2 class="mt-3">غير مصرح لك بالدخول</h2>
                <p>هذه الصفحة مخصصة للمشرفين فقط</p>
                <button onclick="window.location.hash='#/'" class="btn-golden mt-3">العودة للرئيسية</button>
            </div>
        `;
        return;
    }

    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="admin-page">
            <h2 class="page-title mb-4">
                <i class="bi bi-shield-check"></i>
                لوحة التحكم
            </h2>

            <!-- Filters -->
            <div class="admin-filters mb-4">
                <button class="btn-filter active" data-filter="all">الكل</button>
                <button class="btn-filter" data-filter="pending">قيد الانتظار</button>
                <button class="btn-filter" data-filter="active">نشط</button>
            </div>

            <!-- Members Table -->
            <div class="table-responsive">
                <table class="table admin-table">
                    <thead>
                        <tr>
                            <th>الرقم</th>
                            <th>الاسم</th>
                            <th>الحالة</th>
                            <th>الدور</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="membersTableBody">
                        ${renderMembersRows(members)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setupAdminListeners(members); // إعداد مستمعي الأحداث
}

/**
 * دالة عرض صفوف الأعضاء في الجدول
 * @param {Array} membersToRender - قائمة الأعضاء المراد عرضهم
 * @returns {string} HTML لصفوف الجدول
 */
function renderMembersRows(membersToRender) {
    return membersToRender.map(member => `
        <tr data-member-id="${member.id}" data-status="${member.status}">
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>
                <span class="status-badge status-${member.status}">
                    ${member.status === 'active' ? 'نشط' : 'قيد الانتظار'}
                </span>
            </td>
            <td>
                <span class="role-badge">
                    ${member.role === 'admin' ? 'مشرف' : 'عضو'}
                </span>
            </td>
            <td>
                ${member.status === 'pending' ? `
                    <button class="btn-action btn-approve" data-member-id="${member.id}">
                        <i class="bi bi-check-circle"></i> قبول
                    </button>
                    <button class="btn-action btn-reject" data-member-id="${member.id}">
                        <i class="bi bi-x-circle"></i> رفض
                    </button>
                ` : '<span class="text-muted">لا توجد إجراءات</span>'}
            </td>
        </tr>
    `).join('');
}

/**
 * دالة إعداد مستمعي الأحداث للوحة التحكم
 * تتعامل مع الفلاتر وأزرار القبول والرفض
 */
function setupAdminListeners(members) {
    // أزرار الفلترة (الكل، قيد الانتظار، نشط)
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            filterMembers(filter);
        });
    });

    // أزرار القبول
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const member = members.find(m => m.id === memberId);
            approveMember(memberId, member, members); // قبول العضو
        });
    });

    // أزرار الرفض
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const member = members.find(m => m.id === memberId);
            rejectMember(memberId, member, members);
        });
    });
}

/**
 * دالة فلترة الأعضاء حسب الحالة
 * @param {string} status - الحالة المراد الفلترة بها (all, pending, active)
 */
function filterMembers(status) {
    const rows = document.querySelectorAll('#membersTableBody tr');

    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const rowStatus = row.getAttribute('data-status');
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
}

/**
 * دالة قبول طلب عضوية (Async)
 * تحول حالة العضو من 'pending' إلى 'active' عبر Supabase
 * @param {string} memberId - معرف العضو
 * @param {Object} member - كائن العضو
 * @param {Array} members - قائمة الأعضاء
 */
async function approveMember(memberId, member, members) {
    // طلب تأكيد من المشرف
    Swal.fire({
        title: 'تأكيد القبول',
        text: `هل تريد قبول العضو: ${member.name}؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، قبول',
        cancelButtonText: 'إلغاء',
        customClass: {
            confirmButton: 'btn-golden',
            cancelButton: 'btn-secondary'
        },
        background: '#041E3B',
        color: '#E5E5E5'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // إرسال طلب التحديث إلى Supabase
                await adminApproveMember(memberId);

                // تحديث الكائن المحلي
                const memberToUpdate = members.find(m => m.id === memberId);
                if (memberToUpdate) {
                    memberToUpdate.status = 'active';
                }

                Swal.fire({
                    title: 'تم القبول!',
                    text: `تم قبول ${member.name} كعضو نشط`,
                    icon: 'success',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });

                // Refresh the table
                document.getElementById('membersTableBody').innerHTML = renderMembersRows(members);
                setupAdminListeners(members);
            } catch (error) {
                console.error('Error approving member:', error);
                Swal.fire({
                    title: 'خطأ',
                    text: 'حدث خطأ أثناء قبول العضو. يرجى المحاولة مرة أخرى.',
                    icon: 'error',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-danger' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

/**
 * دالة رفض طلب عضوية (Async)
 * تحذف العضو من قائمة Supabase نهائياً
 * @param {string} memberId - معرف العضو
 * @param {Object} member - كائن العضو
 * @param {Array} members - قائمة الأعضاء
 */
async function rejectMember(memberId, member, members) {
    // طلب تأكيد من المشرف
    Swal.fire({
        title: 'تأكيد الرفض',
        text: `هل تريد رفض طلب: ${member.name}؟`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، رفض',
        cancelButtonText: 'إلغاء',
        customClass: {
            confirmButton: 'btn-danger',
            cancelButton: 'btn-secondary'
        },
        background: '#041E3B',
        color: '#E5E5E5'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // إرسال طلب الحذف إلى Supabase
                await adminRejectMember(memberId);

                // حذف العضو من القائمة المحلية
                const index = members.findIndex(m => m.id === memberId);
                if (index !== -1) {
                    members.splice(index, 1);
                }

                // عرض رسالة نجاح
                Swal.fire({
                    title: 'تم الرفض',
                    text: 'تم رفض الطلب وحذف العضو',
                    icon: 'success',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });

                // تحديث الجدول بعد الحذف
                document.getElementById('membersTableBody').innerHTML = renderMembersRows(members);
                setupAdminListeners(members); // إعادة ربط المستمعين
            } catch (error) {
                console.error('Error rejecting member:', error);
                Swal.fire({
                    title: 'خطأ',
                    text: 'حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.',
                    icon: 'error',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-danger' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

// تصدير الدالة الرئيسية
export { renderAdminPage };
