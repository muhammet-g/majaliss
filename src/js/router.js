/**
 * ملف الموجه (Router)
 * مسؤول عن إدارة التنقل بين الصفحات في تطبيق الصفحة الواحدة (SPA)
 */

/**
 * فئة الموجه
 * تتعامل مع تسجيل المسارات والتنقل بينها بدون إعادة تحميل الصفحة
 */
class Router {
    /**
     * البناء - يهيئ الموجه ويستمع لتغييرات الـ URL
     */
    constructor() {
        this.routes = {}; // كائن لتخزين جميع المسارات المسجلة
        this.currentRoute = null; // المسار الحالي النشط

        // الاستماع لتغيير الـ Hash في الـ URL
        window.addEventListener('hashchange', () => this.handleRouteChange());
        // الاستماع لتحميل الصفحة لأول مرة
        window.addEventListener('load', () => this.handleRouteChange());
    }

    /**
     * تسجيل مسار جديد
     * @param {string} path - مسار الصفحة (مثال: '/', '/library')
     * @param {function} handler - الدالة التي ستنفذ عند الانتقال لهذا المسار
     */
    register(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * الانتقال إلى مسار محدد
     * @param {string} path - المسار المراد الانتقال إليه
     */
    navigate(path) {
        window.location.hash = path;
    }

    /**
     * معالج تغيير المسار
     * يتم استدعاؤه عند تغيير الـ Hash في الـ URL
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, ...params] = hash.split('/').filter(Boolean);
        const route = path ? `/${path}` : '/';

        // التحقق من وجود المسار المطلوب
        if (this.routes[route]) {
            this.currentRoute = route; // حفظ المسار الحالي
            const contentArea = document.getElementById('contentArea');

            // إضافة تأثير الاختفاء للمحتوى القديم
            contentArea.classList.add('page-transition-exit');

            // انتظار انتهاء تأثير الاختفاء (300 ميلي ثانية)
            setTimeout(() => {
                this.routes[route](params); // تنفيذ الدالة المرتبطة بالمسار
                contentArea.classList.remove('page-transition-exit');
                contentArea.classList.add('page-transition-enter'); // إضافة تأثير الظهور

                // إزالة كلاس التأثير بعد الانتهاء
                setTimeout(() => {
                    contentArea.classList.remove('page-transition-enter');
                }, 300);
            }, 300);
        } else {
            // في حالة عدم وجود المسار، إظهار تحذير والعودة للصفحة الرئيسية
            console.warn(`Route ${route} not found`);
            this.navigate('/');
        }
    }

    /**
     * الحصول على المسار الحالي
     * @returns {string} المسار النشط حالياً
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
}

export default Router;
