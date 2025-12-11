import type { Entity } from "./api";

export class AdminTable {
    private container: HTMLElement;
    private onEdit: (id: number) => void;
    private onDelete: (id: number) => void;

    constructor(
        container: HTMLElement,
        onEdit: (id: number) => void,
        onDelete: (id: number) => void
    ) {
        this.container = container;
        this.onEdit = onEdit;
        this.onDelete = onDelete;
    }

    render(data: Entity[]) {
        if (!data.length) {
            this.container.innerHTML = `<div class="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">No items found. Click 'Create New' to add one.</div>`;
            return;
        }

        const rows = data.map(item => `
            <tr class="group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td class="py-4 px-6 text-sm font-mono text-gray-500 dark:text-gray-400 w-16">#${item.id}</td>
                <td class="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white w-full">
                    ${item.name || item.botText?.substring(0,60) || (item.condition ? `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold mr-2">DIAGNOSIS</span> ${item.condition.name}` : '<span class="italic text-gray-400">Unnamed</span>')}
                </td>
                <td class="py-4 px-6 text-right">
                    <div class="flex gap-2 justify-end">
                        <button class="edit-btn p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition" title="Edit" data-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button class="del-btn p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition" title="Delete" data-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');

        this.container.innerHTML = `
            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th class="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                            <th class="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name / Content</th>
                            <th class="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">${rows}</tbody>
                </table>
            </div>`;

        this.container.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e) => this.onEdit(Number((e.currentTarget as HTMLElement).dataset.id))));
        this.container.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', (e) => this.onDelete(Number((e.currentTarget as HTMLElement).dataset.id))));
    }
}