import type { EntityConfig } from "./config";
import { AdminApi } from "./api";
import { FieldRenderers } from "./renderers";

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
            <form id="admin-form">${fieldsHtml.join('')}
                <button type="submit" class="mt-6 bg-[#5B3E86] text-white px-6 py-3 rounded-lg w-full font-medium">Save</button>
            </form>`;

        this.hydrate();
    }

    private hydrate() {
        document.getElementById('cancel-btn')?.addEventListener('click', this.onCancel);
        document.getElementById('admin-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e.target as HTMLFormElement);
        });

        // Initialize Dynamic Choice Lists
        this.container.querySelectorAll('.choice-wrapper').forEach(async (wrapper) => {
            const endpoint = wrapper.getAttribute('data-endpoint')!;
            const container = wrapper.querySelector('.choice-container')!;
            const nodes = await AdminApi.getAll(endpoint);
            const opts = nodes.map(n => `<option value="${n.id}">${n.id} - ${(n as any).botText?.substring(0,20)}...</option>`).join('');

            const addRow = (txt = '', next = '') => {
                const row = document.createElement('div');
                row.className = "flex gap-2 choice-row";
                row.innerHTML = `<input class="flex-1 px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" value="${txt}" placeholder="Text"><select class="w-1/3 px-2 py-1 border rounded dark:bg-gray-800 dark:text-white"><option value="">Link...</option>${opts}</select><button type="button" class="text-red-500 font-bold px-2 remove">&times;</button>`;
                if(next) (row.querySelector('select') as HTMLSelectElement).value = next;
                row.querySelector('.remove')!.addEventListener('click', () => row.remove());
                container.appendChild(row);
            };

            wrapper.querySelector('.btn-add-choice')!.addEventListener('click', () => addRow());
            
            const existing = wrapper.getAttribute('data-existing');
            if (existing) {
                try { JSON.parse(atob(existing)).forEach((c: any) => addRow(c.text, c.nextNode?.id)); } catch {}
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