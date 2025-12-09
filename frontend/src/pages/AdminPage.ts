import { authFetch } from "../utils/auth";
import adminHtml from "./templates/AdminPage.html?raw";
import { ENTITY_CONFIGS, type EntityConfig, type AdminField } from "./AdminConfig";

// --- Types & Interfaces ---
interface Entity { id: number; name?: string; [key: string]: any; }

// --- Icons ---
const ICONS = {
    EDIT: `<svg class="w-5 h-5 text-blue-500 hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`,
    TRASH: `<svg class="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
};

// --- Service Layer (SRP: Handles Data Access only) ---
const ApiService = {
    baseUrl: 'http://localhost:3000',

    async getAll(endpoint: string): Promise<Entity[]> {
        try {
            const res = await authFetch(`${this.baseUrl}/${endpoint}`);
            return res.ok ? await res.json() : [];
        } catch { return []; }
    },

    async getOne(endpoint: string, id: number): Promise<Entity | null> {
        try {
            const res = await authFetch(`${this.baseUrl}/${endpoint}/${id}`);
            return res.ok ? await res.json() : null;
        } catch { return null; }
    },

    async save(endpoint: string, payload: any, id: number | null) {
        const url = id ? `${this.baseUrl}/admin/${endpoint}/${id}` : `${this.baseUrl}/admin/${endpoint}`;
        const method = id ? 'PUT' : 'POST';
        return await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async delete(endpoint: string, id: number) {
        return await authFetch(`${this.baseUrl}/admin/${endpoint}/${id}`, { method: 'DELETE' });
    }
};

// --- Field Strategies (OCP: Add new field types here without breaking core logic) ---
const FieldRenderer = {
    baseClasses: "w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition",

    text(field: AdminField) {
        return this._wrapper(field, `<input type="text" id="${field.name}" name="${field.name}" class="${this.baseClasses}" ${field.required ? 'required' : ''}>`);
    },

    number(field: AdminField) {
        return this._wrapper(field, `<input type="number" id="${field.name}" name="${field.name}" class="${this.baseClasses}" ${field.required ? 'required' : ''}>`);
    },

    select(field: AdminField) {
        return this._wrapper(field, `<select id="${field.name}" name="${field.name}" class="${this.baseClasses}"></select>`);
    },

    'multi-select'(field: AdminField) {
        return this._wrapper(field, `<label class="text-xs text-gray-500 block mb-1">(Hold Ctrl/Cmd to select multiple)</label><select id="${field.name}" name="${field.name}" multiple class="h-40 ${this.baseClasses}"></select>`);
    },

    'choice-list'(field: AdminField) {
        return `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${field.label}</label>
                <div id="choice-list-container-${field.name}" class="space-y-3 mb-3 choice-container" data-field="${field.name}"></div>
                <button type="button" data-target="${field.name}" class="btn-add-choice text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 px-3 py-1 rounded transition text-black dark:text-white">+ Add Choice</button>
            </div>`;
    },

    _wrapper(field: AdminField, inputHtml: string) {
        return `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${field.label}</label>
                ${inputHtml}
            </div>`;
    },

    render(field: AdminField) {
        const renderer = (FieldRenderer as any)[field.type];
        return typeof renderer === 'function'
            ? renderer.call(FieldRenderer, field)
            : '';
    }
};

// --- Specialized Handlers (KISS: Extract complex DOM logic) ---
const ChoiceListHandler = {
    async populate(containerId: string, endpoint: string, existingData: any[]) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Fetch available nodes for the dropdown
        const nodes = await ApiService.getAll(endpoint);
        const optionsHtml = nodes.map(n => `<option value="${n.id}">${n.id} - ${(n as any).botText?.substring(0, 30)}...</option>`).join('');

        const createRow = (text = '', nextNodeId = '') => {
            const row = document.createElement('div');
            row.className = "flex gap-2 items-center choice-row";
            row.innerHTML = `
                <input type="text" placeholder="Choice Text" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white text-sm" value="${text}">
                <select class="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white text-sm">
                    <option value="">Link to Node...</option>
                    ${optionsHtml}
                </select>
                <button type="button" class="text-red-500 hover:text-red-700 p-2 font-bold">&times;</button>
            `;
            if (nextNodeId) (row.querySelector('select') as HTMLSelectElement).value = nextNodeId;
            row.querySelector('button')!.addEventListener('click', () => row.remove());
            container.appendChild(row);
        };

        // Attach logic to the "Add" button sibling
        const addBtn = document.querySelector(`button[data-target="${container.getAttribute('data-field')}"]`);
        addBtn?.addEventListener('click', () => createRow());

        // Pre-fill
        if (existingData && Array.isArray(existingData)) {
            existingData.forEach(c => createRow(c.text, c.nextNode?.id));
        }
    },

    extract(containerId: string) {
        const rows = document.querySelectorAll(`#${containerId} .choice-row`);
        return Array.from(rows).map(row => ({
            text: (row.querySelector('input') as HTMLInputElement).value,
            nextNode: { id: Number((row.querySelector('select') as HTMLSelectElement).value) }
        })).filter(c => c.text && c.nextNode.id);
    }
};

// --- UI Components ---
const DataTable = {
    getDisplayName(item: Entity) {
        if (item.name) return item.name;
        if (item.condition) return `${item.condition.name} Diagnosis`;
        if (item.botText) return `"${item.botText.substring(0, 50)}..."`;
        return 'Unnamed';
    },

    render(data: Entity[]) {
        if (data.length === 0) return `<div class="text-center py-10 text-gray-500">No items found. Create one!</div>`;
        
        const rows = data.map(item => `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td class="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">#${item.id}</td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-300 w-full">${this.getDisplayName(item)}</td>
                <td class="py-3 px-4 flex gap-3 justify-end">
                    <button class="btn-edit p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" data-id="${item.id}">${ICONS.EDIT}</button>
                    <button class="btn-delete p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition" data-id="${item.id}">${ICONS.TRASH}</button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-sm text-gray-400 border-b-2 border-gray-100 dark:border-gray-800"><th class="py-2 px-4">ID</th><th class="py-2 px-4">Name / Description</th><th class="py-2 px-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
};

// --- Main Controller (Setup) ---
export const setupAdminPage = (navigate: (path: string) => void) => {
    let state = {
        type: 'CopingMechanism',
        editingId: null as number | null
    };

    const elements = {
        content: document.getElementById('main-content-area')!,
        title: document.getElementById('page-title')!,
        createBtn: document.getElementById('btn-create-new')!,
        navItems: document.querySelectorAll('.nav-item')
    };

    const updateNavState = () => {
        elements.navItems.forEach(n => {
            const isActive = n.getAttribute('data-target') === state.type;
            n.classList.toggle('bg-gray-100', isActive);
            n.classList.toggle('dark:bg-gray-800', isActive);
            n.classList.toggle('font-semibold', isActive);
        });
    };

    // --- View Logic ---
    const loadListView = async () => {
        state.editingId = null;
        elements.createBtn.style.display = 'block';
        elements.title.textContent = ENTITY_CONFIGS[state.type].label;
        elements.content.innerHTML = `<div class="text-center py-10 text-gray-500">Loading...</div>`;
        updateNavState();

        const data = await ApiService.getAll(ENTITY_CONFIGS[state.type].endpoint);
        elements.content.innerHTML = DataTable.render(data);

        // Bind Table Events
        elements.content.querySelectorAll('.btn-edit').forEach(b => 
            b.addEventListener('click', (e) => {
                state.editingId = Number((e.currentTarget as HTMLElement).dataset.id);
                loadFormView();
            })
        );
        elements.content.querySelectorAll('.btn-delete').forEach(b => 
            b.addEventListener('click', async (e) => {
                if (confirm('Delete this item?')) {
                    await ApiService.delete(ENTITY_CONFIGS[state.type].endpoint, Number((e.currentTarget as HTMLElement).dataset.id));
                    loadListView();
                }
            })
        );
    };

    const loadFormView = async () => {
        const config = ENTITY_CONFIGS[state.type];
        elements.createBtn.style.display = 'none';
        
        // Render Form Shell
        elements.content.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold dark:text-white">${state.editingId ? 'Edit' : 'Create'} ${config.label}</h3>
                <button id="btn-cancel" class="text-sm text-gray-500 hover:underline">Cancel</button>
            </div>
            <form id="entity-form">${config.fields.map(f => FieldRenderer.render(f)).join('')}
                <button type="submit" class="mt-6 bg-[#5B3E86] text-white px-6 py-3 rounded-lg hover:bg-[#4a326c] w-full font-medium shadow-md">Save</button>
            </form>
        `;

        document.getElementById('btn-cancel')?.addEventListener('click', loadListView);

        // Fetch Data if editing
        const data = state.editingId ? await ApiService.getOne(config.endpoint, state.editingId) : null;

        // Populate Fields
        for (const field of config.fields) {
            const input = document.getElementById(field.name) as HTMLInputElement | HTMLSelectElement;
            
            // Handle Relational Dropdowns (Select/Multi)
            if (field.endpoint && field.type !== 'choice-list') {
                const options = await ApiService.getAll(field.endpoint);
                const selectedIds = new Set<number>();
                if (data && data[field.name]) {
                    Array.isArray(data[field.name]) ? data[field.name].forEach((i: any) => selectedIds.add(i.id)) : selectedIds.add(data[field.name].id);
                }
                input.innerHTML = options.map(opt => 
                    `<option value="${opt.id}" ${selectedIds.has(opt.id) ? 'selected' : ''}>${DataTable.getDisplayName(opt)}</option>`
                ).join('');
            }
            // Handle Choice List
            else if (field.type === 'choice-list') {
                await ChoiceListHandler.populate(`choice-list-container-${field.name}`, field.endpoint!, data?.[field.name]);
            }
            // Handle Basic Inputs
            else if (data && input) {
                input.value = data[field.name];
            }
        }

        // Handle Submit
        document.getElementById('entity-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const payload: any = {};

            config.fields.forEach(field => {
                if (field.type === 'choice-list') {
                    payload[field.name] = ChoiceListHandler.extract(`choice-list-container-${field.name}`);
                } else if (field.type === 'select') {
                    payload[field.name] = formData.get(field.name) ? { id: Number(formData.get(field.name)) } : null;
                } else if (field.type === 'multi-select') {
                    const el = document.getElementById(field.name) as HTMLSelectElement;
                    payload[field.name] = Array.from(el.selectedOptions).map(o => ({ id: Number(o.value) }));
                } else {
                    payload[field.name] = field.type === 'number' ? Number(formData.get(field.name)) : formData.get(field.name);
                }
            });

            try {
                const res = await ApiService.save(config.endpoint, payload, state.editingId);
                if (res.ok) loadListView();
                else alert('Error saving data');
            } catch { alert('Network error'); }
        });
    };

    // --- Initialization ---
    document.getElementById('btn-back-home')?.addEventListener('click', () => navigate('/'));
    elements.createBtn.addEventListener('click', () => { state.editingId = null; loadFormView(); });
    elements.navItems.forEach(btn => btn.addEventListener('click', (e) => {
        state.type = (e.currentTarget as HTMLElement).dataset.target!;
        loadListView();
    }));

    loadListView();
};

// Re-export render function to match original signature needed by main.ts
export const renderAdminPage = () => adminHtml;