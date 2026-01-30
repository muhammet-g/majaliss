/**
 * ملف لوحة التحكم الإدارية (admin.js)
 * يتيح للمشرفين إدارة طلبات العضوية
 */

import Swal from 'sweetalert2';
import { adminApproveMember, adminRejectMember, fetchMembers } from '../services.js';
import { supabase } from '../supabaseClient.js';

/**
 * دالة عرض صفحة لوحة التحكم
 * متاحة فقط للمشرفين (التحقق من الخادم)
 * @param {Object} currentUser - المستخدم الحالي
 * @param {Array} members - قائمة الأعضاء
 */
function renderAdminPage(currentUser, members) {
    // ✅ SECURITY CHECK: Admin only
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

            <!-- New Join Requests Section -->
            <section class="join-requests-section mb-5">
                <h3 class="section-title">
                    <i class="bi bi-person-plus-fill"></i>
                    طلبات الانضمام الجديدة
                </h3>
                <div id="requests-container" class="requests-container">
                    <!-- Pending requests will be loaded here -->
                    <div class="loading-requests text-center">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- All Members Section -->
            <section class="all-members-section">
                <h3 class="section-title">
                    <i class="bi bi-people-fill"></i>
                    جميع الأعضاء
                </h3>

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
                                <th>البريد الإلكتروني</th>
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
            </section>
        </div>
    `;

    // Load pending requests
    fetchPendingRequests();

    // Setup listeners
    setupAdminListeners(members);
}

/**
 * دالة عرض صفوف الأعضاء في الجدول
 * @param {Array} membersToRender - قائمة الأعضاء المراد عرضهم
 * @returns {string} HTML لصفوف الجدول
 */
function renderMembersRows(membersToRender) {
    if (!membersToRender || membersToRender.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center">لا يوجد أعضاء</td>
            </tr>
        `;
    }

    return membersToRender.map(member => `
        <tr data-member-id="${member.id}" data-status="${member.status}">
            <td>${member.id.substring(0, 8)}...</td>
            <td>${member.name}</td>
            <td>${member.email || 'غير متوفر'}</td>
            <td>
                <span class="status-badge status-${member.status}">
                    ${member.status === 'active' ? 'نشط' : member.status === 'pending' ? 'قيد الانتظار' : member.status}
                </span>
            </td>
            <td>
                <span class="role-badge">
                    ${member.role === 'admin' ? 'مشرف' : 'عضو'}
                </span>
            </td>
            <td>
                ${member.status === 'pending' ? `
                    <button class="btn-action btn-approve" data-member-id="${member.id}" data-member-name="${member.name}">
                        <i class="bi bi-check-circle"></i> قبول
                    </button>
                    <button class="btn-action btn-reject" data-member-id="${member.id}" data-member-name="${member.name}">
                        <i class="bi bi-x-circle"></i> رفض
                    </button>
                ` : '<span class="text-muted">لا توجد إجراءات</span>'}
            </td>
        </tr>
    `).join('');
}

/**
 * دالة جلب طلبات الانضمام قيد الانتظار
 * تجلب فقط الأعضاء الذين حالتهم 'pending'
 */
async function fetchPendingRequests() {
    const container = document.getElementById('requests-container');

    try {
        // Fetch pending members from Supabase
        const { data: pendingMembers, error } = await supabase
            .from('members')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Check if there are any pending requests
        if (!pendingMembers || pendingMembers.length === 0) {
            container.innerHTML = `
                <div class="no-requests text-center">
                    <i class="bi bi-check-circle" style="font-size: 3rem; color: #28a745; opacity: 0.5;"></i>
                    <p class="mt-3">لا توجد طلبات انضمام جديدة</p>
                </div>
            `;
            return;
        }

        // Render pending request cards
        container.innerHTML = pendingMembers.map(member => `
            <div class="request-card" data-request-id="${member.id}">
                <div class="request-header">
                    <div class="request-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="request-info">
                        <h5 class="request-name">${member.name}</h5>
                        <p class="request-email">
                            <i class="bi bi-envelope"></i>
                            ${member.email}
                        </p>
                        ${member.phone ? `
                            <p class="request-phone">
                                <i class="bi bi-telephone"></i>
                                ${member.phone}
                            </p>
                        ` : ''}
                    </div>
                    <div class="request-date">
                        <small>${formatDate(member.created_at)}</small>
                    </div>
                </div>
                ${member.reason ? `
                    <div class="request-reason">
                        <strong>سبب الانضمام:</strong>
                        <p>${member.reason}</p>
                    </div>
                ` : ''}
                <div class="request-actions">
                    <button class="btn-approve-card" data-member-id="${member.id}" data-member-name="${member.name}">
                        <i class="bi bi-check-circle"></i>
                        موافقة
                    </button>
                    <button class="btn-reject-card" data-member-id="${member.id}" data-member-name="${member.name}">
                        <i class="bi bi-x-circle"></i>
                        رفض
                    </button>
                </div>
            </div>
        `).join('');

        // Setup listeners for the new buttons
        setupRequestCardListeners();

    } catch (error) {
        console.error('Error fetching pending requests:', error);
        container.innerHTML = `
            <div class="error-message text-center">
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                <p class="mt-3">حدث خطأ أثناء تحميل الطلبات</p>
            </div>
        `;
    }
}

/**
 * دالة تنسيق التاريخ
 * @param {string} dateString - التاريخ بصيغة ISO
 * @returns {string} التاريخ المنسق
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

    // أزرار القبول في الجدول
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const memberName = btn.getAttribute('data-member-name');
            approveMemberFromTable(memberId, memberName, members);
        });
    });

    // أزرار الرفض في الجدول
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const memberName = btn.getAttribute('data-member-name');
            rejectMemberFromTable(memberId, memberName, members);
        });
    });
}

/**
 * دالة إعداد مستمعي الأحداث لبطاقات الطلبات
 */
function setupRequestCardListeners() {
    // أزرار الموافقة في البطاقات
    document.querySelectorAll('.btn-approve-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const memberName = btn.getAttribute('data-member-name');
            approveMemberFromCard(memberId, memberName);
        });
    });

    // أزرار الرفض في البطاقات
    document.querySelectorAll('.btn-reject-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.getAttribute('data-member-id');
            const memberName = btn.getAttribute('data-member-name');
            rejectMemberFromCard(memberId, memberName);
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
 * دالة قبول طلب عضوية من البطاقة (Async)
 * تحول حالة العضو من 'pending' إلى 'active' عبر Supabase
 * @param {string} memberId - معرف العضو
 * @param {string} memberName - اسم العضو
 */
async function approveMemberFromCard(memberId, memberName) {
    Swal.fire({
        title: 'تأكيد القبول',
        text: `هل تريد قبول العضو: ${memberName}؟`,
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
                // Update status to 'active' in Supabase
                await adminApproveMember(memberId);

                // Show success message
                Swal.fire({
                    title: 'تم القبول!',
                    text: `تم قبول ${memberName} كعضو نشط`,
                    icon: 'success',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });

                // Remove card from UI immediately
                const card = document.querySelector(`[data-request-id="${memberId}"]`);
                if (card) {
                    card.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        card.remove();
                        // Check if there are any remaining cards
                        const remainingCards = document.querySelectorAll('.request-card');
                        if (remainingCards.length === 0) {
                            fetchPendingRequests(); // Reload to show "no requests" message
                        }
                    }, 300);
                }

                // Reload page data to update the table
                setTimeout(() => location.reload(), 1500);

            } catch (error) {
                console.error('Error approving member:', error);
                Swal.fire({
                    title: 'خطأ',
                    text: 'حدث خطأ أثناء قبول العضو. يرجى المحاولة مرة أخرى.',
                    icon: 'error',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

/**
 * دالة رفض طلب عضوية من البطاقة (Async)
 * تحذف العضو من قائمة Supabase نهائياً
 * @param {string} memberId - معرف العضو
 * @param {string} memberName - اسم العضو
 */
async function rejectMemberFromCard(memberId, memberName) {
    Swal.fire({
        title: 'تأكيد الرفض',
        text: `هل تريد رفض طلب: ${memberName}؟`,
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
                // Delete member from Supabase
                await adminRejectMember(memberId);

                // Show success message
                Swal.fire({
                    title: 'تم الرفض',
                    text: 'تم رفض الطلب وحذف العضو',
                    icon: 'success',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });

                // Remove card from UI immediately
                const card = document.querySelector(`[data-request-id="${memberId}"]`);
                if (card) {
                    card.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        card.remove();
                        // Check if there are any remaining cards
                        const remainingCards = document.querySelectorAll('.request-card');
                        if (remainingCards.length === 0) {
                            fetchPendingRequests(); // Reload to show "no requests" message
                        }
                    }, 300);
                }

                // Reload page data to update the table
                setTimeout(() => location.reload(), 1500);

            } catch (error) {
                console.error('Error rejecting member:', error);
                Swal.fire({
                    title: 'خطأ',
                    text: 'حدث خطأ أثناء رفض الطلب. يرجى المحاولة مرة أخرى.',
                    icon: 'error',
                    confirmButtonText: 'حسناً',
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

/**
 * دالة قبول طلب عضوية من الجدول (Async)
 * @param {string} memberId - معرف العضو
 * @param {string} memberName - اسم العضو
 * @param {Array} members - قائمة الأعضاء
 */
async function approveMemberFromTable(memberId, memberName, members) {
    // طلب تأكيد من المشرف
    Swal.fire({
        title: 'تأكيد القبول',
        text: `هل تريد قبول العضو: ${memberName}؟`,
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
                    text: `تم قبول ${memberName} كعضو نشط`,
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
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

/**
 * دالة رفض طلب عضوية من الجدول (Async)
 * تحذف العضو من قائمة Supabase نهائياً
 * @param {string} memberId - معرف العضو
 * @param {string} memberName - اسم العضو
 * @param {Array} members - قائمة الأعضاء
 */
async function rejectMemberFromTable(memberId, memberName, members) {
    // طلب تأكيد من المشرف
    Swal.fire({
        title: 'تأكيد الرفض',
        text: `هل تريد رفض طلب: ${memberName}؟`,
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
                    customClass: { confirmButton: 'btn-golden' },
                    background: '#041E3B',
                    color: '#E5E5E5'
                });
            }
        }
    });
}

// تصدير الدالة الرئيسية
export { renderAdminPage };
