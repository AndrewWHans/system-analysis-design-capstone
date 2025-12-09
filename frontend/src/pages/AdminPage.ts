import { authFetch } from "../utils/auth";
import adminHtml from "./templates/AdminPage.html?raw";
import { ENTITY_CONFIGS, type EntityConfig, type AdminField } from "./AdminConfig";

interface Entity { id: number; name?: string; [key: string]: any; }

const ICON_EDIT = `<svg class="w-5 h-5 text-blue-500 hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`;
const ICON_TRASH = `<svg class="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;

let currentType = 'CopingMechanism';
let isEditingId: number | null = null;

export const renderAdminPage = () => adminHtml;

// --- Generic API Helpers ---
const fetchData = async (endpoint: string) => {
    try {
        const res = await authFetch(`http://localhost:3000/${endpoint}`);
        return res.ok ? await res.json() as Entity[] : [];
    } catch { return []; }
};

const fetchSingle = async (endpoint: string, id: number) => {
    try {
        const res = await authFetch(`http://localhost:3000/${endpoint}/${id}`);
        return res.ok ? await res.json() as Entity : null;
    } catch { return null; }
};

// --- Generic Rendering Logic ---
const renderTable = (data: Entity[]) => {
    if (data.length === 0) return `<div class="text-center py-10 text-gray-500">No items found. Create one!</div>`;
    
    const rows = data.map(item => {
        // Fallback for Diagnosis/Scenario/DialogueNode which might not have a direct 'name' property
        let displayName = item.name;
        
        if (!displayName) {
             if (item.condition) displayName = `${item.condition.name} Diagnosis`;
             else if (item.botText) displayName = `"${item.botText.substring(0, 50)}..."`; // For DialogueNodes
             else displayName = 'Unnamed';
        }

        return `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td class="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">#${item.id}</td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-300 w-full">${displayName}</td>
            <td class="py-3 px-4 flex gap-3 justify-end">
                <button class="btn-edit p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" data-id="${item.id}">${ICON_EDIT}</button>
                <button class="btn-delete p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition" data-id="${item.id}">${ICON_TRASH}</button>
            </td>
        </tr>`;
    }).join('');

    return `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-sm text-gray-400 border-b-2 border-gray-100 dark:border-gray-800">
                        <th class="py-2 px-4 font-semibold">ID</th>
                        <th class="py-2 px-4 font-semibold">Name / Description</th>
                        <th class="py-2 px-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
};

// Helper to generate specific input HTML
const generateInputHtml = (field: AdminField) => {
    const commonClasses = "w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition";
    
    if (field.type === 'select' || field.type === 'multi-select') {
        const isMulti = field.type === 'multi-select';
        return `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${field.label} ${isMulti ? '(Hold Ctrl/Cmd)' : ''}</label>
                <select id="${field.name}" name="${field.name}" ${isMulti ? 'multiple class="h-40 ' + commonClasses + '"' : 'class="' + commonClasses + '"'}></select>
            </div>`;
    }

    // New Choice List Logic
    if (field.type === 'choice-list') {
        return `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${field.label}</label>
                <div id="choice-list-container" class="space-y-3 mb-3">
                    <!-- Dynamic Choices appear here -->
                </div>
                <button type="button" id="btn-add-choice" class="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded transition text-black dark:text-white">
                    + Add Choice
                </button>
            </div>
        `;
    }

    return `
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${field.label}</label>
            <input type="${field.type}" id="${field.name}" name="${field.name}" class="${commonClasses}" ${field.required ? 'required' : ''}>
        </div>`;
};

const renderDynamicForm = (config: EntityConfig) => {
    const fieldsHtml = config.fields.map(generateInputHtml).join('');
    return `
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-black dark:text-white">${isEditingId ? 'Edit' : 'Create'} ${config.label}</h3>
        <button id="btn-cancel-form" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
      <form id="create-form">
        ${fieldsHtml}
        <button type="submit" class="mt-6 bg-[#5B3E86] text-white px-6 py-3 rounded-lg hover:bg-[#4a326c] transition w-full font-medium shadow-md">
            ${isEditingId ? 'Update' : 'Create'}
        </button>
        <div id="msg" class="mt-4 text-center text-sm font-medium"></div>
      </form>
    `;
};

// --- Form Population Logic ---
const prepareForm = async (config: EntityConfig, data: Entity | null) => {
    for (const field of config.fields) {
        if (field.endpoint && field.type !== 'choice-list') {
            const selectEl = document.getElementById(field.name) as HTMLSelectElement;
            if (selectEl) {
                const options = await fetchData(field.endpoint);
                
                let selectedIds = new Set<number>();
                if (data && data[field.name]) {
                    if (Array.isArray(data[field.name])) {
                        data[field.name].forEach((i: any) => selectedIds.add(i.id));
                    } else if (data[field.name].id) {
                        selectedIds.add(data[field.name].id);
                    }
                }

                selectEl.innerHTML = options.map(opt => 
                    `<option value="${opt.id}" ${selectedIds.has(opt.id) ? 'selected' : ''}>${opt.name || (opt as any).botText?.substring(0,30) + '...' || 'ID '+opt.id}</option>`
                ).join('');
            }
        } else if (field.type === 'choice-list') {
            // Logic for Dialogue Node Choices
            const container = document.getElementById('choice-list-container')!;
            const addBtn = document.getElementById('btn-add-choice')!;
            
            // 1. Fetch potential "Next Nodes" to populate the dropdowns
            const allNodes = field.endpoint ? await fetchData(field.endpoint) : [];
            const nodeOptions = allNodes.map(n => 
                `<option value="${n.id}">${n.id} - ${(n as any).botText?.substring(0, 30)}...</option>`
            ).join('');

            // Helper to add a row to the DOM
            const addRow = (text: string = '', nextNodeId: string = '') => {
                const row = document.createElement('div');
                row.className = "flex gap-2 items-center choice-row";
                row.innerHTML = `
                    <input type="text" placeholder="Choice Text" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white text-sm" value="${text}">
                    <select class="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 dark:text-white text-sm">
                        <option value="">Link to Node...</option>
                        ${nodeOptions}
                    </select>
                    <button type="button" class="text-red-500 hover:text-red-700 p-2 font-bold">&times;</button>
                `;
                
                if(nextNodeId) (row.querySelector('select') as HTMLSelectElement).value = nextNodeId;
                
                // Remove row event
                row.querySelector('button')!.addEventListener('click', () => row.remove());
                container.appendChild(row);
            };

            addBtn.addEventListener('click', () => addRow());

            // 2. Populate existing choices if editing
            if (data && data[field.name] && Array.isArray(data[field.name])) {
                data[field.name].forEach((choice: any) => {
                    // Expecting choice structure: { text: "...", nextNode: { id: 1 } }
                    addRow(choice.text, choice.nextNode?.id);
                });
            }

        } else if (data && data[field.name] !== undefined) {
            // Fill basic text/number inputs
            const inputEl = document.getElementById(field.name) as HTMLInputElement;
            if (inputEl) inputEl.value = data[field.name];
        }
    }
};

// --- Payload Extraction Logic ---
const extractPayload = (config: EntityConfig, form: HTMLFormElement) => {
    const formData = new FormData(form);
    const payload: any = {};

    config.fields.forEach(field => {
        if (field.type === 'choice-list') {
             // Extract choices manually from DOM
             const rows = document.querySelectorAll('.choice-row');
             const choices: any[] = [];
             rows.forEach(row => {
                 const text = (row.querySelector('input') as HTMLInputElement).value;
                 const nextNodeId = (row.querySelector('select') as HTMLSelectElement).value;
                 
                 if (text && nextNodeId) {
                     choices.push({
                         text: text,
                         nextNode: { id: Number(nextNodeId) }
                     });
                 }
             });
             payload[field.name] = choices;
        } else if (field.type === 'text') {
            payload[field.name] = formData.get(field.name);
        } else if (field.type === 'number') {
            payload[field.name] = Number(formData.get(field.name));
        } else if (field.type === 'select') {
            const el = document.getElementById(field.name) as HTMLSelectElement;
            payload[field.name] = el.value ? { id: Number(el.value) } : null;
        } else if (field.type === 'multi-select') {
            const el = document.getElementById(field.name) as HTMLSelectElement;
            payload[field.name] = Array.from(el.selectedOptions).map(opt => ({ id: Number(opt.value) }));
        }
    });
    return payload;
};

// --- Main Setup ---
export const setupAdminPage = (navigate: (path: string) => void) => {
    document.getElementById('btn-back-home')?.addEventListener('click', () => navigate('/'));

    const contentArea = document.getElementById('main-content-area')!;
    const titleEl = document.getElementById('page-title')!;
    const createBtn = document.getElementById('btn-create-new')!;
    const navItems = document.querySelectorAll('.nav-item');

    // View: List
    const loadListView = async () => {
        const config = ENTITY_CONFIGS[currentType];
        isEditingId = null;
        createBtn.style.display = 'block';
        contentArea.innerHTML = `<div class="text-center py-10 text-gray-500">Loading...</div>`;
        
        // Highlight Nav
        navItems.forEach(n => {
            n.getAttribute('data-target') === currentType 
                ? n.classList.add('bg-gray-100', 'dark:bg-gray-800', 'font-semibold') 
                : n.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'font-semibold');
        });

        titleEl.textContent = config.label;
        const data = await fetchData(config.endpoint);
        contentArea.innerHTML = renderTable(data);

        // Attach Event Listeners
        contentArea.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                if(confirm('Are you sure?')) {
                    try {
                        await authFetch(`http://localhost:3000/admin/${config.endpoint}/${id}`, { method: 'DELETE' });
                        loadListView();
                    } catch (e) { console.error(e); }
                }
            });
        });

        contentArea.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                isEditingId = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
                loadFormView();
            });
        });
    };

    // View: Form
    const loadFormView = async () => {
        const config = ENTITY_CONFIGS[currentType];
        createBtn.style.display = 'none';
        contentArea.innerHTML = renderDynamicForm(config);
        
        document.getElementById('btn-cancel-form')?.addEventListener('click', loadListView);

        let existingData = null;
        if (isEditingId) existingData = await fetchSingle(config.endpoint, isEditingId);
        
        await prepareForm(config, existingData);

        // Handle Submit
        const form = document.getElementById('create-form') as HTMLFormElement;
        const msg = document.getElementById('msg')!;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            msg.textContent = "Processing...";
            msg.className = "mt-4 text-center text-sm font-medium text-gray-500";

            try {
                const payload = extractPayload(config, form);
                const url = isEditingId 
                    ? `http://localhost:3000/admin/${config.endpoint}/${isEditingId}` 
                    : `http://localhost:3000/admin/${config.endpoint}`;
                
                const res = await authFetch(url, {
                    method: isEditingId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error("Operation failed");

                msg.textContent = "Success!";
                msg.className = "mt-4 text-center text-sm font-medium text-green-600";
                setTimeout(loadListView, 500);
            } catch (err) {
                console.error(err);
                msg.textContent = "Error saving entity.";
                msg.className = "mt-4 text-center text-sm font-medium text-red-600";
            }
        });
    };

    // Init
    loadListView();

    navItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentType = (e.target as HTMLElement).getAttribute('data-target')!;
            loadListView();
        });
    });

    createBtn.addEventListener('click', () => {
        isEditingId = null;
        loadFormView();
    });
};