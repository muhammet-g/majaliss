/**
 * ملف البيانات (data.js)
 * يحتوي على البيانات الوهمية للأعضاء والكتب
 */

/**
 * قائمة الأعضاء
 * تحتوي على معلومات الأعضاء وحالاتهم وأدوارهم
 * 
 * الحالات الممكنة:
 * - active: عضو نشط (يمكنه الوصول لجميع الميزات)
 * - pending: عضو قيد الانتظار (تحت المراجعة)
 * 
 * الأدوار الممكنة:
 * - admin: مشرف (لديه صلاحيات إدارية)
 * - member: عضو عادي
 */
const members = [
    { id: 1, name: 'أحمد الغامدي', status: 'active', role: 'admin' },
    { id: 2, name: 'فاطمة الزهراني', status: 'active', role: 'member' },
    { id: 3, name: 'خالد المصري', status: 'pending', role: 'member' },
    { id: 4, name: 'عائشة بنت محمد', status: 'active', role: 'member' },
];

/**
 * قائمة الكتب
 * تحتوي على معلومات الكتب المتاحة في المكتبة
 * 
 * حالات الكتب الممكنة:
 * - read: كتاب تمت قراءته
 * - current: كتاب قيد القراءة حالياً
 * - upcoming: كتاب قادم (لم تبدأ قراءته بعد)
 */
const books = [
    { id: 1, title: 'مقدمة ابن خلدون', coverImage: 'https://via.placeholder.com/150/041E3B/CD9B14?text=Book+Cover', status: 'read' },
    { id: 2, title: 'ألف ليلة وليلة', coverImage: 'https://via.placeholder.com/150/041E3B/CD9B14?text=Book+Cover', status: 'read' },
    { id: 3, title: 'كليلة ودمنة', coverImage: 'https://via.placeholder.com/150/041E3B/CD9B14?text=Book+Cover', status: 'upcoming' },
    { id: 4, title: 'طوق الحمامة', coverImage: 'https://via.placeholder.com/150/041E3B/CD9B14?text=Book+Cover', status: 'upcoming' },
];

// تصدير البيانات لاستخدامها في ملفات أخرى
export { members, books };
