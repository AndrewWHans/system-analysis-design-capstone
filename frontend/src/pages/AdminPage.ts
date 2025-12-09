import adminHtml from "./templates/AdminPage.html?raw";
import { AdminConfig } from "./admin/config";
import { AdminApi } from "./admin/api";
import { AdminTable } from "./admin/Table";
import { AdminForm } from "./admin/Form";

export const renderAdminPage = () => adminHtml;

export const setupAdminPage = (navigate: (path: string) => void) => {
    let currentType = 'CopingMechanism';
    const contentDiv = document.getElementById('main-content-area')!;
    const createBtn = document.getElementById('btn-create-new')!;

    const loadList = async () => {
        document.getElementById('page-title')!.textContent = AdminConfig[currentType].label;
        createBtn.style.display = 'block';
        contentDiv.innerHTML = `<div class="text-center py-10 text-gray-500">Loading...</div>`;
        
        // Update Nav UI
        document.querySelectorAll('.nav-item').forEach(b => {
            const active = (b as HTMLElement).dataset.target === currentType;
            b.classList.toggle('bg-gray-100', active);
            b.classList.toggle('dark:bg-gray-800', active);
            b.classList.toggle('font-bold', active);
        });

        const data = await AdminApi.getAll(AdminConfig[currentType].endpoint);
        new AdminTable(contentDiv, loadForm, async (id) => {
            if (confirm('Delete?')) { await AdminApi.delete(AdminConfig[currentType].endpoint, id); loadList(); }
        }).render(data);
    };

    const loadForm = (id: number | null) => {
        createBtn.style.display = 'none';
        contentDiv.innerHTML = `<div class="text-center py-10 text-gray-500">Loading Form...</div>`;
        new AdminForm(contentDiv, AdminConfig[currentType], async (data) => {
            if ((await AdminApi.save(AdminConfig[currentType].endpoint, data, id)).ok) loadList();
            else alert('Error saving');
        }, loadList).render(id);
    };

    document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', (e) => {
        currentType = (e.currentTarget as HTMLElement).dataset.target!;
        loadList();
    }));

    createBtn.addEventListener('click', () => loadForm(null));
    document.getElementById('btn-back-home')?.addEventListener('click', () => navigate('/'));
    
    loadList();
};