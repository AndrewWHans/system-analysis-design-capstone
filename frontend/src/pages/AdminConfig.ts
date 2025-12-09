// Define the types of inputs our admin panel supports
export type FieldType = 'text' | 'number' | 'select' | 'multi-select';

export interface AdminField {
    name: string;       // Property name in API (e.g., 'lifeImpact')
    label: string;      // Display label (e.g., 'Life Impact')
    type: FieldType;
    endpoint?: string;  // If select/multi, where to fetch options (e.g., 'triggers')
    required?: boolean;
}

export interface EntityConfig {
    endpoint: string;   // API endpoint (e.g., 'coping-mechanisms')
    label: string;      // Display name (e.g., 'Coping Mechanisms')
    fields: AdminField[];
}

// Reusable fields
const nameField: AdminField = { name: 'name', label: 'Name', type: 'text', required: true };

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
    CopingMechanism: {
        endpoint: 'coping-mechanisms',
        label: 'Coping Mechanisms',
        fields: [nameField]
    },
    Trigger: {
        endpoint: 'triggers',
        label: 'Triggers',
        fields: [nameField]
    },
    Mood: {
        endpoint: 'moods',
        label: 'Moods',
        fields: [nameField]
    },
    Symptom: {
        endpoint: 'symptoms',
        label: 'Symptoms',
        fields: [
            { name: 'name', label: 'Symptom Name', type: 'text', required: true },
            { name: 'severity', label: 'Severity (1-10)', type: 'number', required: true },
            { name: 'frequency', label: 'Frequency (1-5)', type: 'number', required: true },
            { name: 'duration', label: 'Duration (1-5)', type: 'number', required: true },
            { name: 'lifeImpact', label: 'Life Impact (1-10)', type: 'number', required: true },
            { name: 'triggers', label: 'Associated Triggers', type: 'multi-select', endpoint: 'triggers' },
            { name: 'moods', label: 'Associated Moods', type: 'multi-select', endpoint: 'moods' },
            { name: 'copingMechanisms', label: 'Coping Mechanisms', type: 'multi-select', endpoint: 'coping-mechanisms' }
        ]
    },
    Condition: {
        endpoint: 'conditions',
        label: 'Conditions',
        fields: [
            { name: 'name', label: 'Condition Name', type: 'text', required: true },
            { name: 'symptoms', label: 'Associated Symptoms', type: 'multi-select', endpoint: 'symptoms' }
        ]
    },
    Diagnosis: {
        endpoint: 'diagnoses',
        label: 'Diagnoses',
        fields: [
            { name: 'condition', label: 'Condition', type: 'select', endpoint: 'conditions', required: true },
            { name: 'symptoms', label: 'Confirming Symptoms', type: 'multi-select', endpoint: 'symptoms' }
        ]
    }
};