import type { EntityConfig } from "./config";
import { AdminApi } from "./api";
import { FieldRenderers } from "./renderers";
import TomSelect from "tom-select";

export class AdminForm {
    private container: HTMLElement;
    private config: EntityConfig;
    private onSubmit: (data: any) => Promise<void>;
    private onCancel: () => void;

    constructor(
        container: HTMLElement,
        config: EntityConfig,
        onSubmit: (data: any) => Promise<void>,
        onCancel: () => void
    ) {
        this.container = container;
        this.config = config;
        this.onSubmit = onSubmit;
        this.onCancel = onCancel;
    }

    async render(id: number | null) {
        const data = id ? await AdminApi.getOne(this.config.endpoint, id) : null;
        
        const fieldsHtml = await Promise.all(this.config.fields.map(async f => {
            const renderer = (FieldRenderers as any)[f.type];
            return renderer ? await renderer({ field: f, value: data?.[f.name] }) : '';
        }));

        this.container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold dark:text-white">${id ? 'Edit' : 'Create'} ${this.config.label}</h3>
                <button id="cancel-btn" class="text-sm text-gray-500 hover:underline">Cancel</button>
            </div>
            <form id="admin-form" autocomplete="off">${fieldsHtml.join('')}
                <button type="submit" class="mt-6 bg-[#5B3E86] text-white px-6 py-3 rounded-lg w-full font-medium hover:bg-[#4a326c] transition">Save</button>
            </form>`;

        this.hydrate();
    }

    private hydrate() {
        document.getElementById('cancel-btn')?.addEventListener('click', this.onCancel);
        document.getElementById('admin-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e.target as HTMLFormElement);
        });

        // Initialize Tom Select for marked fields
        this.container.querySelectorAll('.tom-select-target').forEach((el) => {
            new TomSelect(el as HTMLSelectElement, {
                plugins: ['remove_button', 'clear_button'],
                persist: false,
                create: false,
                maxItems: (el as HTMLSelectElement).multiple ? null : 1
            });
        });

        // Initialize dynamic choice ists
        this.container.querySelectorAll('.choice-wrapper').forEach(async (wrapper) => {
            const endpoint = wrapper.getAttribute('data-endpoint')!;
            const container = wrapper.querySelector('.choice-container')!;
            const nodes = await AdminApi.getAll(endpoint);
            
            // Prepare options HTML string once
            const optsHtml = nodes.map(n => `<option value="${n.id}">${n.id} - ${(n as any).botText?.substring(0,30)}...</option>`).join('');

            const addRow = (txt = '', next = '') => {
                const row = document.createElement('div');
                row.className = "flex gap-2 choice-row items-start";
                
                // We use a textarea for text to allow more content visibility
                // We use a select with class 'tom-select-nested' to init TomSelect on it later
                row.innerHTML = `
                    <input class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value="${txt}" placeholder="Choice Text" required>
                    <div class="w-1/3">
                        <select class="tom-select-nested" placeholder="Link to node..."><option value="">Link...</option>${optsHtml}</select>
                    </div>
                    <button type="button" class="text-red-500 hover:text-red-700 font-bold px-2 py-2 remove transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                `;
                
                if(next) (row.querySelector('select') as HTMLSelectElement).value = next;
                
                row.querySelector('.remove')!.addEventListener('click', () => row.remove());
                container.appendChild(row);

                // Initialize TomSelect on this specific new row's select
                new TomSelect(row.querySelector('.tom-select-nested') as HTMLSelectElement, {
                    maxItems: 1,
                    create: false,
                    plugins: ['clear_button']
                });
            };

            wrapper.querySelector('.btn-add-choice')!.addEventListener('click', () => addRow());
            
            const existing = wrapper.getAttribute('data-existing');
            if (existing) {
                try { 
                    const parsed = JSON.parse(atob(existing));
                    if(Array.isArray(parsed)) parsed.forEach((c: any) => addRow(c.text, c.nextNode?.id)); 
                } catch {}
            }
        });
    }

    private handleSubmit(form: HTMLFormElement) {
        const formData = new FormData(form);
        const payload: any = {};

        this.config.fields.forEach(f => {
            if (f.type === 'choice-list') {
                const rows = this.container.querySelectorAll(`[data-field="${f.name}"] .choice-row`);
                payload[f.name] = Array.from(rows).map(r => ({
                    text: (r.querySelector('input') as HTMLInputElement).value,
                    nextNode: { id: Number((r.querySelector('select') as HTMLSelectElement).value) }
                })).filter(c => c.text && c.nextNode.id);
            } else if (f.type === 'select') {
                const val = formData.get(f.name);
                payload[f.name] = val ? { id: Number(val) } : null;
            } else if (f.type === 'multi-select') {
                const el = form.querySelector(`[name="${f.name}"]`) as HTMLSelectElement;
                payload[f.name] = Array.from(el.selectedOptions).map(o => ({ id: Number(o.value) }));
            } else {
                payload[f.name] = f.type === 'number' ? Number(formData.get(f.name)) : formData.get(f.name);
            }
        });
        this.onSubmit(payload);
    }
}