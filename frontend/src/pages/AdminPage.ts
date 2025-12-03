import { getToken } from "../utils/auth";
import adminHtml from "./templates/AdminPage.html?raw";

interface Entity { id: number; name?: string; [key: string]: any; }

const ICON_EDIT = `<svg class="w-5 h-5 text-blue-500 hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`;
const ICON_TRASH = `<svg class="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;

let currentType = 'CopingMechanism';
let isEditingId: number | null = null;

export const renderAdminPage = () => {
    return adminHtml;
};

// Helpers & Logic
const getEndpoint = (type: string) => {
    let ep = type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + 's';
    if(type === 'Diagnosis') ep = 'diagnoses';
    return ep;
}

const fetchData = async (endpoint: string) => {
  try {
    const res = await fetch(`http://localhost:3000/${endpoint}`);
    return await res.json() as Entity[];
  } catch { return []; }
};

const fetchSingle = async (endpoint: string, id: number) => {
    try {
        const res = await fetch(`http://localhost:3000/${endpoint}/${id}`);
        return await res.json() as Entity;
    } catch { return null; }
}

const renderTable = (data: Entity[]) => {
    if (data.length === 0) return `<div class="text-center py-10 text-gray-500">No items found. Create one!</div>`;
    const rows = data.map(item => `
        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td class="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">#${item.id}</td>
            <td class="py-3 px-4 text-gray-600 dark:text-gray-300 w-full">${item.name || (item.condition ? item.condition.name + ' Diagnosis' : 'Unnamed')}</td>
            <td class="py-3 px-4 flex gap-3 justify-end">
                <button class="btn-edit p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition" data-id="${item.id}">${ICON_EDIT}</button>
                <button class="btn-delete p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition" data-id="${item.id}">${ICON_TRASH}</button>
            </td>
        </tr>
    `).join('');
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
        </div>
    `;
};

const renderForm = (type: string) => {
    const commonInput = (id: string, label: string, type="text", ph="") => `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${label}</label>
        <input type="${type}" id="${id}" name="${id}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="${ph}" required>
      </div>
    `;
    const multiSelect = (id: string, label: string) => `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${label} (Hold Ctrl/Cmd to select multiple)</label>
        <select id="${id}" name="${id}" multiple class="w-full h-40 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"></select>
      </div>
    `;
    const singleSelect = (id: string, label: string) => `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${label}</label>
        <select id="${id}" name="${id}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"></select>
      </div>
    `;
    let fields = '';
    if (['CopingMechanism', 'Trigger', 'Mood'].includes(type)) {
      fields = commonInput('name', 'Name');
    } else if (type === 'Symptom') {
      fields = `
        ${commonInput('name', 'Symptom Name')}
        <div class="grid grid-cols-2 gap-4">
          ${commonInput('severity', 'Severity (1-10)', 'number')}
          ${commonInput('frequency', 'Frequency (1-5)', 'number')}
          ${commonInput('duration', 'Duration (1-5)', 'number')}
          ${commonInput('lifeImpact', 'Life Impact (1-10)', 'number')}
        </div>
        ${multiSelect('triggers', 'Associated Triggers')}
        ${multiSelect('moods', 'Associated Moods')}
        ${multiSelect('copingMechanisms', 'Coping Mechanisms')}
      `;
    } else if (type === 'Condition') {
      fields = `
        ${commonInput('name', 'Condition Name')}
        ${multiSelect('symptoms', 'Associated Symptoms')}
      `;
    } else if (type === 'Diagnosis') {
      fields = `
        ${singleSelect('condition', 'Condition')}
        ${multiSelect('symptoms', 'Confirming Symptoms')}
      `;
    }
    return `
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-black dark:text-white">${isEditingId ? 'Edit' : 'Create'} ${type}</h3>
        <button id="btn-cancel-form" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
      </div>
      <form id="create-form" data-type="${type}">
        ${fields}
        <button type="submit" class="mt-6 bg-[#5B3E86] text-white px-6 py-3 rounded-lg hover:bg-[#4a326c] transition w-full font-medium shadow-md">
            ${isEditingId ? 'Update' : 'Create'}
        </button>
        <div id="msg" class="mt-4 text-center text-sm font-medium"></div>
      </form>
    `;
};

const prepareForm = async (type: string, data: Entity | null = null) => {
    const populate = async (selectId: string, endpoint: string, selectedItems: any[] = []) => {
        const el = document.getElementById(selectId) as HTMLSelectElement;
        if (!el) return;
        const options = await fetchData(endpoint);
        const selectedIds = new Set(selectedItems.map((i: any) => i.id));
        el.innerHTML = options.map(d => `<option value="${d.id}" ${selectedIds.has(d.id) ? 'selected' : ''}>${d.name}</option>`).join('');
    };
    if (type === 'Symptom') {
        await populate('triggers', 'triggers', data?.triggers);
        await populate('moods', 'moods', data?.moods);
        await populate('copingMechanisms', 'coping-mechanisms', data?.copingMechanisms);
    } else if (type === 'Condition') {
        await populate('symptoms', 'symptoms', data?.symptoms);
    } else if (type === 'Diagnosis') {
        await populate('condition', 'conditions', data?.condition ? [data.condition] : []);
        await populate('symptoms', 'symptoms', data?.symptoms);
    }
    if (data) {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (data[input.name] !== undefined) input.value = data[input.name];
        });
        if (type === 'Diagnosis' && data.condition) {
             const condSelect = document.getElementById('condition') as HTMLSelectElement;
             if(condSelect) condSelect.value = data.condition.id.toString();
        }
    }
};

export const setupAdminPage = (navigate: (path: string) => void) => {
  document.getElementById('btn-back-home')?.addEventListener('click', () => navigate('/'));

  const contentArea = document.getElementById('main-content-area')!;
  const titleEl = document.getElementById('page-title')!;
  const createBtn = document.getElementById('btn-create-new')!;
  const navItems = document.querySelectorAll('.nav-item');

  const loadListView = async () => {
    isEditingId = null;
    createBtn.style.display = 'block';
    contentArea.innerHTML = `<div class="text-center py-10 text-gray-500">Loading...</div>`;
    navItems.forEach(n => {
        const t = n.getAttribute('data-target');
        if(t === currentType) {
            n.classList.add('bg-gray-100', 'dark:bg-gray-800', 'font-semibold');
        } else {
            n.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'font-semibold');
        }
    });
    titleEl.textContent = currentType.replace(/([A-Z])/g, ' $1').trim() + 's';
    const endpoint = getEndpoint(currentType);
    const data = await fetchData(endpoint);
    contentArea.innerHTML = renderTable(data);

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
            if(confirm('Are you sure you want to delete this item?')) {
                await fetch(`http://localhost:3000/admin/${endpoint}/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                loadListView();
            }
        });
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
            isEditingId = Number(id);
            loadFormView();
        });
    });
  };

  const loadFormView = async () => {
    createBtn.style.display = 'none';
    contentArea.innerHTML = renderForm(currentType);
    document.getElementById('btn-cancel-form')?.addEventListener('click', loadListView);
    const endpoint = getEndpoint(currentType);
    let existingData = null;
    if (isEditingId) existingData = await fetchSingle(endpoint, isEditingId);
    await prepareForm(currentType, existingData);
    setupFormSubmit(currentType, endpoint);
  };

  const setupFormSubmit = (type: string, endpoint: string) => {
    const form = document.getElementById('create-form') as HTMLFormElement;
    const msg = document.getElementById('msg')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = "Processing...";
      msg.className = "mt-4 text-center text-sm font-medium text-gray-500";
      const formData = new FormData(form);
      const payload: any = {};
      const getMulti = (name: string) => {
        const select = document.getElementById(name) as HTMLSelectElement;
        return Array.from(select.selectedOptions).map(opt => ({ id: Number(opt.value) }));
      };
      const getSingle = (name: string) => {
          const select = document.getElementById(name) as HTMLSelectElement;
          return { id: Number(select.value) };
      }
      if (['CopingMechanism', 'Trigger', 'Mood'].includes(type)) {
        payload.name = formData.get('name');
      } else if (type === 'Symptom') {
        payload.name = formData.get('name');
        payload.severity = Number(formData.get('severity'));
        payload.frequency = Number(formData.get('frequency'));
        payload.duration = Number(formData.get('duration'));
        payload.lifeImpact = Number(formData.get('lifeImpact'));
        payload.triggers = getMulti('triggers');
        payload.moods = getMulti('moods');
        payload.copingMechanisms = getMulti('copingMechanisms');
      } else if (type === 'Condition') {
        payload.name = formData.get('name');
        payload.symptoms = getMulti('symptoms');
      } else if (type === 'Diagnosis') {
          payload.condition = getSingle('condition');
          payload.symptoms = getMulti('symptoms');
      }
      try {
        const url = isEditingId ? `http://localhost:3000/admin/${endpoint}/${isEditingId}` : `http://localhost:3000/admin/${endpoint}`;
        const method = isEditingId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed");
        msg.textContent = "Success!";
        msg.className = "mt-4 text-center text-sm font-medium text-green-600";
        setTimeout(() => loadListView(), 500); 
      } catch (err) {
        msg.textContent = "Error saving entity.";
        msg.className = "mt-4 text-center text-sm font-medium text-red-600";
      }
    });
  }

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