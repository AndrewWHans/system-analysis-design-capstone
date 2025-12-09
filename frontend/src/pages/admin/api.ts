import { authFetch } from "../../utils/auth";

export interface Entity {
    id: number;
    name?: string;
    [key: string]: any;
}

export const AdminApi = {
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
        const url = id 
            ? `${this.baseUrl}/admin/${endpoint}/${id}` 
            : `${this.baseUrl}/admin/${endpoint}`;
        
        return await authFetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    async delete(endpoint: string, id: number) {
        return await authFetch(`${this.baseUrl}/admin/${endpoint}/${id}`, { method: 'DELETE' });
    }
};