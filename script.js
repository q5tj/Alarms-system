// Application State Management
class WarningGeneratorApp {
    constructor() {
        this.currentWarningNumber = this.getNextWarningNumber();
        this.warnings = this.loadWarnings();
        this.templates = this.loadTemplates();
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupFormValidation();
        this.loadFormData();
        this.updateAnalytics();
        this.setupAutoSave();
        
        // Set current date
        document.getElementById('warningDate').value = new Date().toISOString().split('T')[0];
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSection(target);
                this.updateActiveNavLink(link);
            });
        });


        // Form events
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generatePreview();
        });

        document.getElementById('clearFormBtn').addEventListener('click', () => {
            this.clearForm();
        });

        document.getElementById('saveTemplateBtn').addEventListener('click', () => {
            this.showTemplateModal();
        });

        // Preview actions
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printWarning();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadPDF();
        });

        document.getElementById('emailBtn').addEventListener('click', () => {
            this.sendEmail();
        });

        // File inputs
        document.getElementById('logo').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'logoPreview');
        });

        document.getElementById('signature').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'signaturePreview');
        });

        // Character counter
        document.getElementById('warningDetails').addEventListener('input', (e) => {
            this.updateCharCounter(e.target);
        });

        // Modal events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        document.getElementById('saveTemplateModalBtn').addEventListener('click', () => {
            this.saveTemplate();
        });

        // History search and filter
        document.getElementById('historySearch').addEventListener('input', (e) => {
            this.filterHistory(e.target.value);
        });

        document.getElementById('historyFilter').addEventListener('change', (e) => {
            this.filterHistoryByType(e.target.value);
        });

        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportHistory();
        });

        // Auto-update preview on form changes
        this.setupLivePreview();
    }

    setupNavigation() {
        // Show generator section by default
        this.showSection('generator');
    }


    setupFormValidation() {
        const form = document.getElementById('warningForm');
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    setupLivePreview() {
        const formInputs = document.querySelectorAll('#warningForm input, #warningForm select, #warningForm textarea');
        formInputs.forEach(input => {
            if (input.type !== 'file') {
                input.addEventListener('input', () => {
                    this.debounce(() => this.updatePreviewLive(), 500)();
                });
            }
        });
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveFormData();
        }, 30000); // Auto-save every 30 seconds
    }

    // Navigation Methods
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Load section-specific data
        switch(sectionId) {
            case 'history':
                this.loadHistory();
                break;
            case 'templates':
                this.loadTemplatesView();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
        }
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }


    // Form Methods
    generatePreview() {
        if (!this.validateForm()) {
            this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        this.showLoading();
        
        setTimeout(() => {
            const warningData = this.collectFormData();
            this.renderPreview(warningData);
            this.saveWarning(warningData);
            this.incrementWarningNumber();
            this.hideLoading();
            this.showToast('تم إنشاء الإنذار بنجاح', 'success');
        }, 1000);
    }

    validateForm() {
        const requiredFields = document.querySelectorAll('#warningForm [required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const isValid = value !== '';
        
        field.classList.toggle('error', !isValid);
        
        if (!isValid) {
            field.focus();
        }
        
        return isValid;
    }

    collectFormData() {
        const formData = new FormData(document.getElementById('warningForm'));
        const data = {};
        
        // Collect all form fields
        const fields = [
            'company', 'department', 'warningType', 'severity',
            'warningDate', 'employeeName', 'employeeId', 'employeeEmail',
            'employeePosition', 'warningReason', 'warningDetails', 'consequences',
            'managerName', 'managerPosition'
        ];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                data[field] = element.value;
            }
        });

        // Handle checkboxes
        data.requireEmployeeSignature = document.getElementById('requireEmployeeSignature').checked;

        // Handle file uploads
        data.logoFile = document.getElementById('logo').files[0];
        data.signatureFile = document.getElementById('signature').files[0];

        // Add metadata
        data.id = this.generateId();
        data.createdAt = new Date().toISOString();
        data.status = 'active';

        return data;
    }

    renderPreview(data) {
        const previewContent = document.getElementById('warningDocument');
        
        const html = `
            <div class="document-watermark">${data.company || 'الشركة'}</div>
            
            <div class="document-header">
                <div class="company-info">
                    ${data.logoFile ? `<img src="${URL.createObjectURL(data.logoFile)}" alt="شعار الشركة" class="company-logo">` : ''}
                    <h2>${data.company || 'اسم الشركة'}</h2>
                    ${data.department ? `<p>${data.department}</p>` : ''}
                </div>
            </div>

            <div class="document-meta">
                <div class="meta-item">
                    <span class="meta-label">نوع الإنذار</span>
                    <span class="meta-value">${data.warningType}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">درجة الخطورة</span>
                    <span class="meta-value">${data.severity}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">التاريخ</span>
                    <span class="meta-value">${this.formatDate(data.warningDate)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">اسم الموظف</span>
                    <span class="meta-value">${data.employeeName}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">رقم الموظف</span>
                    <span class="meta-value">${data.employeeId || 'غير محدد'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">المنصب</span>
                    <span class="meta-value">${data.employeePosition || 'غير محدد'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">البريد الإلكتروني</span>
                    <span class="meta-value">${data.employeeEmail}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">سبب الإنذار</span>
                    <span class="meta-value">${data.warningReason}</span>
                </div>
            </div>

            <div class="document-content">
                <div class="content-section">
                    <h4>تفاصيل الإنذار:</h4>
                    <div class="content-text">${data.warningDetails.replace(/\n/g, '<br>')}</div>
                </div>
                
                ${data.consequences ? `
                <div class="content-section">
                    <h4>العواقب المترتبة:</h4>
                    <div class="content-text">${data.consequences.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
            </div>

            <div class="document-footer">
                <div class="signature-section">
                    <div class="signature-label">توقيع المدير</div>
                    ${data.signatureFile ? 
                        `<img src="${URL.createObjectURL(data.signatureFile)}" alt="توقيع المدير" class="signature-image">` : 
                        '<div class="signature-line"></div>'
                    }
                    <div>${data.managerName || 'اسم المدير'}</div>
                    <div class="signature-label">${data.managerPosition || 'المنصب'}</div>
                </div>
                
                ${data.requireEmployeeSignature ? `
                <div class="signature-section">
                    <div class="signature-label">توقيع الموظف</div>
                    <div class="signature-line"></div>
                    <div>${data.employeeName}</div>
                    <div class="signature-label">التاريخ: ___________</div>
                </div>
                ` : ''}
            </div>
        `;

        previewContent.innerHTML = html;
    }

    updatePreviewLive() {
        const data = this.collectFormData();
        if (data.company || data.employeeName || data.warningDetails) {
            this.renderPreview(data);
        }
    }

    clearForm() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
            document.getElementById('warningForm').reset();
            document.getElementById('warningDate').value = new Date().toISOString().split('T')[0];
            
            // Clear file previews
            document.getElementById('logoPreview').style.display = 'none';
            document.getElementById('signaturePreview').style.display = 'none';
            
            // Reset preview
            document.getElementById('warningDocument').innerHTML = `
                <div class="document-placeholder">
                    <div class="placeholder-icon">📄</div>
                    <p>املأ النموذج لرؤية معاينة الإنذار</p>
                </div>
            `;
            
            this.showToast('تم مسح النموذج', 'success');
        }
    }

    // File Upload Methods
    handleFileUpload(event, previewId) {
        const file = event.target.files[0];
        const preview = document.getElementById(previewId);
        
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                this.showToast('يرجى اختيار ملف صورة صالح', 'error');
                event.target.value = '';
            }
        } else {
            preview.style.display = 'none';
        }
    }

    // Character Counter
    updateCharCounter(textarea) {
        const maxLength = 1000;
        const currentLength = textarea.value.length;
        const counter = document.getElementById('charCount');
        
        counter.textContent = currentLength;
        counter.style.color = currentLength > maxLength ? '#ef4444' : '#64748b';
        
        if (currentLength > maxLength) {
            textarea.value = textarea.value.substring(0, maxLength);
            counter.textContent = maxLength;
        }
    }

    // Print and Export Methods
    printWarning() {
        if (!this.validateForm()) {
            this.showToast('يرجى إنشاء الإنذار أولاً', 'error');
            return;
        }
        
        window.print();
    }

    downloadPDF() {
        if (!this.validateForm()) {
            this.showToast('يرجى إنشاء الإنذار أولاً', 'error');
            return;
        }
        
        this.showLoading();
        
        // Simulate PDF generation
        setTimeout(() => {
            const data = this.collectFormData();
            const blob = new Blob([this.generateHTMLForExport(data)], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.showToast('تم تحميل الملف بنجاح', 'success');
        }, 1500);
    }

    sendEmail() {
        if (!this.validateForm()) {
            this.showToast('يرجى إنشاء الإنذار أولاً', 'error');
            return;
        }
        
        const data = this.collectFormData();
        const subject = encodeURIComponent(`إنذار موظف - ${data.employeeName} - ${data.company}`);
        const body = encodeURIComponent(this.generateEmailBody(data));
        
        window.location.href = `mailto:${data.employeeEmail}?subject=${subject}&body=${body}`;
    }

    generateEmailBody(data) {
        return `
السلام عليكم ورحمة الله وبركاته،

نحيطكم علماً بصدور إنذار بحقكم وفقاً للتفاصيل التالية:

نوع الإنذار: ${data.warningType}
التاريخ: ${this.formatDate(data.warningDate)}
سبب الإنذار: ${data.warningReason}

تفاصيل الإنذار:
${data.warningDetails}

${data.consequences ? `العواقب المترتبة:\n${data.consequences}\n` : ''}

يرجى مراجعة قسم الموارد البشرية لاستلام نسخة رسمية من الإنذار.

مع تحيات إدارة الموارد البشرية
${data.company}
        `.trim();
    }

    generateHTMLForExport(data) {
        return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; text-align: right; margin: 20px; }
        .warning-document { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
        .document-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .warning-badge { background: #fef3c7; color: #92400e; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
        .document-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 5px; }
        .meta-item { margin-bottom: 10px; }
        .meta-label { font-size: 12px; color: #666; font-weight: bold; }
        .meta-value { font-weight: bold; color: #333; }
        .document-content { margin-bottom: 30px; }
        .content-section { margin-bottom: 20px; }
        .content-section h4 { color: #333; margin-bottom: 10px; font-weight: bold; }
        .content-text { line-height: 1.8; color: #555; }
        .document-footer { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
        .signature-section { text-align: center; }
        .signature-line { width: 200px; height: 1px; background: #000; margin: 20px auto 10px; }
        .signature-label { font-size: 12px; color: #666; }
    </style>
</head>
<body>
    ${document.getElementById('warningDocument').innerHTML}
</body>
</html>
        `;
    }

    // Template Methods
    showTemplateModal() {
        document.getElementById('templateModal').classList.add('active');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    saveTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const description = document.getElementById('templateDescription').value.trim();
        
        if (!name) {
            this.showToast('يرجى إدخال اسم القالب', 'error');
            return;
        }
        
        const templateData = this.collectFormData();
        templateData.templateName = name;
        templateData.templateDescription = description;
        templateData.templateId = this.generateId();
        templateData.createdAt = new Date().toISOString();
        
        this.templates.push(templateData);
        this.saveTemplates();
        this.closeModal();
        this.showToast('تم حفظ القالب بنجاح', 'success');
        
        // Clear modal form
        document.getElementById('templateForm').reset();
    }

    loadTemplatesView() {
        const container = document.getElementById('templatesGrid');
        
        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="template-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                    <h3>لا توجد قوالب محفوظة</h3>
                    <p>أنشئ قالبك الأول لتسريع عملية إنشاء الإنذارات</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.templates.map(template => `
            <div class="template-card" data-template-id="${template.templateId}">
                <div class="template-header">
                    <div>
                        <div class="template-title">${template.templateName}</div>
                        <div class="template-description">${template.templateDescription || 'لا يوجد وصف'}</div>
                    </div>
                    <div class="template-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.useTemplate('${template.templateId}')">
                            <span>📋</span> استخدام
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.deleteTemplate('${template.templateId}')">
                            <span>🗑️</span> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    useTemplate(templateId) {
        const template = this.templates.find(t => t.templateId === templateId);
        if (!template) return;
        
        // Fill form with template data
        const fields = [
            'company', 'department', 'warningType', 'severity',
            'warningReason', 'warningDetails', 'consequences',
            'managerName', 'managerPosition'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && template[field]) {
                element.value = template[field];
            }
        });
        
        // Switch to generator section
        this.showSection('generator');
        this.updateActiveNavLink(document.querySelector('[href="#generator"]'));
        
        this.showToast('تم تحميل القالب بنجاح', 'success');
    }

    deleteTemplate(templateId) {
        if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
            this.templates = this.templates.filter(t => t.templateId !== templateId);
            this.saveTemplates();
            this.loadTemplatesView();
            this.showToast('تم حذف القالب', 'success');
        }
    }

    // History Methods
    loadHistory() {
        const container = document.getElementById('historyList');
        
        if (this.warnings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--bg-primary); border-radius: var(--radius-lg);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <h3>لا توجد إنذارات محفوظة</h3>
                    <p>ابدأ بإنشاء إنذار جديد لرؤيته في السجل</p>
                </div>
            `;
            return;
        }
        
        const sortedWarnings = [...this.warnings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = sortedWarnings.map(warning => `
            <div class="history-item" data-warning-id="${warning.id}">
                <div class="history-header">
                    <div>
                        <div class="history-meta">
                            ${this.formatDate(warning.warningDate)} • ${warning.warningType} • ${warning.company}
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-sm btn-outline" onclick="app.viewWarning('${warning.id}')">
                            <span>👁️</span> عرض
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.duplicateWarning('${warning.id}')">
                            <span>📋</span> نسخ
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.deleteWarning('${warning.id}')">
                            <span>🗑️</span> حذف
                        </button>
                    </div>
                </div>
                <div class="history-content">
                    ${warning.warningDetails.substring(0, 150)}${warning.warningDetails.length > 150 ? '...' : ''}
                </div>
                <div class="history-tags">
                    <span class="history-tag">${warning.severity}</span>
                    <span class="history-tag">${warning.warningReason}</span>
                </div>
            </div>
        `).join('');
    }

    filterHistory(searchTerm) {
        const items = document.querySelectorAll('.history-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }

    filterHistoryByType(type) {
        const items = document.querySelectorAll('.history-item');
        items.forEach(item => {
            if (!type) {
                item.style.display = 'block';
            } else {
                const matches = item.textContent.includes(type);
                item.style.display = matches ? 'block' : 'none';
            }
        });
    }

    viewWarning(warningId) {
        const warning = this.warnings.find(w => w.id === warningId);
        if (!warning) return;
        
        // Fill form with warning data and switch to generator
        this.fillFormWithData(warning);
        this.renderPreview(warning);
        this.showSection('generator');
        this.updateActiveNavLink(document.querySelector('[href="#generator"]'));
    }

    duplicateWarning(warningId) {
        const warning = this.warnings.find(w => w.id === warningId);
        if (!warning) return;
        
        // Fill form with warning data but generate new number
        this.fillFormWithData(warning);
        
        this.showSection('generator');
        this.updateActiveNavLink(document.querySelector('[href="#generator"]'));
        this.showToast('تم نسخ الإنذار', 'success');
    }

    deleteWarning(warningId) {
        if (confirm('هل أنت متأكد من حذف هذا الإنذار؟')) {
            this.warnings = this.warnings.filter(w => w.id !== warningId);
            this.saveWarnings();
            this.loadHistory();
            this.updateAnalytics();
            this.showToast('تم حذف الإنذار', 'success');
        }
    }

    fillFormWithData(data) {
        const fields = [
            'company', 'department', 'warningType', 'severity', 'warningDate',
            'employeeName', 'employeeId', 'employeeEmail', 'employeePosition',
            'warningReason', 'warningDetails', 'consequences',
            'managerName', 'managerPosition'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && data[field]) {
                element.value = data[field];
            }
        });
        
        document.getElementById('requireEmployeeSignature').checked = data.requireEmployeeSignature || false;
    }

    exportHistory() {
        if (this.warnings.length === 0) {
            this.showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `warnings-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('تم تصدير السجل بنجاح', 'success');
    }

    generateCSV() {
        const headers = [
            'رقم الإنذار', 'اسم الموظف', 'البريد الإلكتروني', 'نوع الإنذار',
            'درجة الخطورة', 'سبب الإنذار', 'التاريخ', 'الشركة'
        ];
        
        const rows = this.warnings.map(warning => [
            warning.employeeName,
            warning.employeeEmail,
            warning.warningType,
            warning.severity,
            warning.warningReason,
            warning.warningDate,
            warning.company
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Analytics Methods
// Analytics Methods
updateAnalytics() {
    const totalWarnings = this.warnings.length;
    const byType = {};
    const bySeverity = {};

    this.warnings.forEach(w => {
        byType[w.warningType] = (byType[w.warningType] || 0) + 1;
        bySeverity[w.severity] = (bySeverity[w.severity] || 0) + 1;
    });

    // تحديث واجهة الإحصائيات
    document.getElementById('totalWarnings').textContent = totalWarnings;

    const typeContainer = document.getElementById('warningsByType');
    typeContainer.innerHTML = Object.entries(byType)
        .map(([type, count]) => `<div>${type}: ${count}</div>`)
        .join('');

    const severityContainer = document.getElementById('warningsBySeverity');
    severityContainer.innerHTML = Object.entries(bySeverity)
        .map(([severity, count]) => `<div>${severity}: ${count}</div>`)
        .join('');
}
    updateSimpleCharts() {
        // Simple text-based charts for demonstration
        const warningTypesChart = document.getElementById('warningTypesChart');
        const monthlyChart = document.getElementById('monthlyChart');
        
        if (warningTypesChart) {
            const types = {};
            this.warnings.forEach(w => {
                types[w.warningType] = (types[w.warningType] || 0) + 1;
            });
            
            warningTypesChart.innerHTML = Object.entries(types)
                .map(([type, count]) => `<div style="margin: 10px 0;">${type}: ${count}</div>`)
                .join('');
        }
        
        if (monthlyChart) {
            const months = {};
            this.warnings.forEach(w => {
                const month = new Date(w.warningDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
                months[month] = (months[month] || 0) + 1;
            });
            
            monthlyChart.innerHTML = Object.entries(months)
                .map(([month, count]) => `<div style="margin: 10px 0;">${month}: ${count}</div>`)
                .join('');
        }
    }

    // Data Management Methods
    saveWarning(warningData) {
        this.warnings.push(warningData);
        this.saveWarnings();
    }

    saveWarnings() {
        localStorage.setItem('warnings', JSON.stringify(this.warnings));
    }

    loadWarnings() {
        const saved = localStorage.getItem('warnings');
        return saved ? JSON.parse(saved) : [];
    }

    saveTemplates() {
        localStorage.setItem('templates', JSON.stringify(this.templates));
    }

    loadTemplates() {
        const saved = localStorage.getItem('templates');
        return saved ? JSON.parse(saved) : [];
    }

    saveFormData() {
        const data = this.collectFormData();
        localStorage.setItem('formDraft', JSON.stringify(data));
    }

    loadFormData() {
        const saved = localStorage.getItem('formDraft');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.fillFormWithData(data);
            } catch (e) {
                console.error('Error loading form data:', e);
            }
        }
    }

    // Warning Number Management
    getNextWarningNumber() {
        const saved = localStorage.getItem('nextWarningNumber');
        return saved ? parseInt(saved, 10) : 1;
    }

    incrementWarningNumber() {
        this.currentWarningNumber++;
        localStorage.setItem('nextWarningNumber', this.currentWarningNumber.toString());
    }

    formatWarningNumber(number) {
        return number.toString().padStart(4, '0');
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // UI Feedback Methods
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Initialize the application
const app = new WarningGeneratorApp();
window.app = app;

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    app.showToast('حدث خطأ غير متوقع', 'error');
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}