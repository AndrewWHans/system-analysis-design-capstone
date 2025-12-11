import { AdminApi } from "./api";
import type { AdminField } from "./config";

const INPUT_CSS = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#5B3E86] focus:border-transparent outline-none transition shadow-sm";

const wrap = (label: string, html: string) => `
    <div class="mb-5"><label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">${label}</label>${html}</div>`;

export const FieldRenderers = {
    text: ({ field, value }: { field: AdminField, value: any }) => 
        wrap(field.label, `<input type="text" name="${field.name}" class="${INPUT_CSS}" value="${value || ''}" ${field.required ? 'required' : ''} placeholder="Enter ${field.label}...">`),

    number: ({ field, value }: { field: AdminField, value: any }) => 
        wrap(field.label, `<input type="number" name="${field.name}" class="${INPUT_CSS}" value="${value || ''}" ${field.required ? 'required' : ''} placeholder="0">`),

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
            <div class="mb-6 choice-wrapper p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800" data-field="${field.name}" data-endpoint="${field.endpoint}" data-existing="${json}">
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">${field.label}</label>
                <div class="choice-container space-y-3 mb-3"></div>
                <button type="button" class="btn-add-choice w-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-[#5B3E86] hover:border-[#5B3E86] transition shadow-sm border-dashed">
                    + Add Choice Option
                </button>
            </div>`;
    }
};