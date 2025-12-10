export type FieldType = 'text' | 'number' | 'select' | 'multi-select' | 'choice-list';

export interface AdminField {
    name: string;
    label: string;
    type: FieldType;
    endpoint?: string;
    required?: boolean;
}

export interface EntityConfig {
    endpoint: string;
    label: string;
    fields: AdminField[];
}

const nameField: AdminField = { name: 'name', label: 'Name', type: 'text', required: true };

export const AdminConfig: Record<string, EntityConfig> = {
    CopingMechanism: { endpoint: 'coping-mechanisms', label: 'Coping Mechanisms', fields: [nameField] },
    Trigger: { endpoint: 'triggers', label: 'Triggers', fields: [nameField] },
    Mood: { endpoint: 'moods', label: 'Moods', fields: [nameField] },
    Symptom: {
        endpoint: 'symptoms',
        label: 'Symptoms',
        fields: [
            { name: 'name', label: 'Symptom Name', type: 'text', required: true },
            { name: 'severity', label: 'Severity (0-10)', type: 'number', required: true },
            { name: 'frequency', label: 'Frequency (0-5)', type: 'number', required: true },
            { name: 'duration', label: 'Duration (0-5)', type: 'number', required: true },
            { name: 'lifeImpact', label: 'Life Impact (0-10)', type: 'number', required: true },
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
            { name: 'condition', label: 'Condition', type: 'select', endpoint: 'conditions', required: true }
        ]
    },
    Scenario: {
        endpoint: 'scenarios',
        label: 'Scenarios',
        fields: []
    }
};