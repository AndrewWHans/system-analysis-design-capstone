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
            this.container.innerHTML = `<div class="text-center py-10 text-gray-500">No items found. Create one!</div>`;
            return;
        }

        const rows = data.map(item => `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-3 px-4 dark:text-gray-200">#${item.id}</td>
                <td class="py-3 px-4 dark:text-gray-300 w-full">${item.name || item.botText?.substring(0,50) || (item.condition ? item.condition.name + ' Diagnosis' : 'Unnamed')}</td>
                <td class="py-3 px-4 flex gap-3 justify-end">
                    <button class="edit-btn text-blue-500 hover:underline" data-id="${item.id}">Edit</button>
                    <button class="del-btn text-red-500 hover:underline" data-id="${item.id}">Delete</button>
                </td>
            </tr>`).join('');

        this.container.innerHTML = `
            <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
                <thead><tr class="text-sm text-gray-400 border-b-2 border-gray-100 dark:border-gray-800"><th class="py-2 px-4">ID</th><th class="py-2 px-4">Name/Content</th><th class="py-2 px-4 text-right">Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;

        this.container.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e) => this.onEdit(Number((e.target as HTMLElement).dataset.id))));
        this.container.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', (e) => this.onDelete(Number((e.target as HTMLElement).dataset.id))));
    }
}