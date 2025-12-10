import adminHtml from "./templates/AdminPage.html?raw";
import { AdminConfig } from "./admin/config";
import { AdminApi } from "./admin/api";
import { AdminTable } from "./admin/Table";
import { AdminForm } from "./admin/Form";
import { ScenarioBuilder } from "./admin/ScenarioBuilder";

export const renderAdminPage = () => adminHtml;

export const setupAdminPage = (navigate: (path: string) => void) => {
    let currentType = 'CopingMechanism';
    const contentDiv = document.getElementById('main-content-area')!;
    const createBtn = document.getElementById('btn-create-new')!;

    const loadList = async () => {
        // Set title and reset UI
        document.getElementById('page-title')!.textContent = AdminConfig[currentType].label;
        createBtn.style.display = 'block';
        contentDiv.innerHTML = `<div class="text-center py-10 text-gray-500">Loading...</div>`;
        
        // Update nav highlights
        document.querySelectorAll('.nav-item').forEach(b => {
            const active = (b as HTMLElement).dataset.target === currentType;
            b.classList.toggle('bg-gray-100', active);
            b.classList.toggle('dark:bg-gray-800', active);
            b.classList.toggle('font-bold', active);
        });

        // Fetch data
        let data = await AdminApi.getAll(AdminConfig[currentType].endpoint);

        // Sort the IDS sequentially (ascending)
        if (data && Array.isArray(data)) {
            data.sort((a, b) => a.id - b.id);
        } else {
            data = [];
        }

        // --- Restored search input HTML ---
        contentDiv.innerHTML = `
            <div class="mb-6 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <input 
                    type="text" 
                    id="admin-search-input" 
                    placeholder="Search by ID, Name, or Content..." 
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                >
            </div>
            <div id="table-wrapper"></div>
        `;

        const tableWrapper = document.getElementById('table-wrapper')!;
        const searchInput = document.getElementById('admin-search-input') as HTMLInputElement;

        // Define render logic for table
        const renderTable = (items: any[]) => {
            new AdminTable(tableWrapper, loadEntityEditor, async (id) => {
                if (confirm('Delete?')) { 
                    await AdminApi.delete(AdminConfig[currentType].endpoint, id); 
                    loadList(); 
                }
            }).render(items);
        };

        // Define filter logic
        const filterData = (query: string) => {
            const lowerQuery = query.toLowerCase();
            return data.filter(item => {
                const idMatch = item.id.toString().includes(lowerQuery);
                const nameMatch = item.name?.toLowerCase().includes(lowerQuery);
                const botTextMatch = item.botText?.toLowerCase().includes(lowerQuery);
                const conditionMatch = item.condition?.name?.toLowerCase().includes(lowerQuery);

                return idMatch || nameMatch || botTextMatch || conditionMatch;
            });
        };

        // Attach search listener
        searchInput.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            const filtered = filterData(val);
            renderTable(filtered);
        });

        // Initial render
        renderTable(data);
    };

    const loadEntityEditor = (id: number | null) => {
        if (currentType === 'Scenario') {
            loadScenarioBuilder(id);
        } else {
            loadStandardForm(id);
        }
    };

    const loadStandardForm = (id: number | null) => {
        createBtn.style.display = 'none';
        contentDiv.innerHTML = `<div class="text-center py-10 text-gray-500">Loading Form...</div>`;
        new AdminForm(contentDiv, AdminConfig[currentType], async (data) => {
            if ((await AdminApi.save(AdminConfig[currentType].endpoint, data, id)).ok) loadList();
            else alert('Error saving');
        }, loadList).render(id);
    };

    const loadScenarioBuilder = (id: number | null) => {
        createBtn.style.display = 'none';
        contentDiv.innerHTML = ''; 
        contentDiv.className = "";

        const parentWrapper = contentDiv.parentElement;
        if (parentWrapper) {
            parentWrapper.classList.remove('max-w-5xl');
            parentWrapper.classList.add('max-w-[98%]');
        }

        new ScenarioBuilder(contentDiv, () => {
            // On Back/Save Exit
            
            // Restore Container Styles
            contentDiv.className = "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 min-h-[400px]"; 
            
            // Restore Width Logic
            if (parentWrapper) {
                parentWrapper.classList.remove('max-w-[98%]');
                parentWrapper.classList.add('max-w-5xl');
            }

            loadList();
        }).render(id);
    };

    document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', (e) => {
        currentType = (e.currentTarget as HTMLElement).dataset.target!;
        loadList();
    }));

    createBtn.addEventListener('click', () => loadEntityEditor(null));
    document.getElementById('btn-back-home')?.addEventListener('click', () => navigate('/'));
    
    loadList();
};