import { AdminApi, type Entity } from "./api";
import type { AdminField } from "./config";

const INPUT_CSS = "w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition";

const wrap = (label: string, html: string) => `
    <div class="mb-4"><label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${label}</label>${html}</div>`;

export const FieldRenderers = {
    text: ({ field, value }: { field: AdminField, value: any }) => 
        wrap(field.label, `<input type="text" name="${field.name}" class="${INPUT_CSS}" value="${value || ''}" ${field.required ? 'required' : ''}>`),

    number: ({ field, value }: { field: AdminField, value: any }) => 
        wrap(field.label, `<input type="number" name="${field.name}" class="${INPUT_CSS}" value="${value || ''}" ${field.required ? 'required' : ''}>`),


    select: async ({ field, value }: { field: AdminField, value: any }) => {
        const opts = await AdminApi.getAll(field.endpoint!);
        let html = `<option value="">Select a ${field.label}...</option>`;
        if (opts.length > 0) {
            html += opts.map(o => `<option value="${o.id}" ${value?.id === o.id ? 'selected' : ''}>${o.name || o.id}</option>`).join('');
        }
        
        return wrap(field.label, `<select name="${field.name}" class="tom-select-target" placeholder="Select a ${field.label}...">${html}</select>`);
    },

    'multi-select': async ({ field, value }: { field: AdminField, value: any }) => {
        const opts = await AdminApi.getAll(field.endpoint!);
        const selected = new Set(Array.isArray(value) ? value.map((v: any) => v.id) : []);
        let html = `<option value="" disabled>Select ${field.label}...</option>`;
        if (opts.length > 0) {
            html += opts.map(o => `<option value="${o.id}" ${selected.has(o.id) ? 'selected' : ''}>${o.name || o.id}</option>`).join('');
        }
        return wrap(field.label, `<select name="${field.name}" multiple class="tom-select-target" placeholder="Select ${field.label}...">${html}</select>`);
    },

    'choice-list': async ({ field, value }: { field: AdminField, value: any }) => {
        const json = value ? btoa(JSON.stringify(value)) : '';
        return `
            <div class="mb-4 choice-wrapper" data-field="${field.name}" data-endpoint="${field.endpoint}" data-existing="${json}">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${field.label}</label>
                <div class="choice-container space-y-2 mb-2"></div>
                <button type="button" class="btn-add-choice text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition">+ Add Choice</button>
            </div>`;
    }
};