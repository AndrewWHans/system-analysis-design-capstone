import Drawflow from 'drawflow';
import { AdminApi } from './api';
import TomSelect from 'tom-select';

type NodeType = 'root' | 'dialogue' | 'end';

export class ScenarioBuilder {
    private container: HTMLElement;
    private editor: any;
    private scenarioId: number | null = null;
    private onBack: () => void;

    constructor(container: HTMLElement, onBack: () => void) {
        this.container = container;
        this.onBack = onBack;
    }

    async render(id: number | null) {
        this.scenarioId = id;
        
        const diagnoses = await AdminApi.getAll('diagnoses');
        let scenarioData: any = null;
        if (id) {
            scenarioData = await AdminApi.getOne('scenarios', id);
        }

        this.container.innerHTML = `
            <div class="flex h-[calc(100vh-150px)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <!-- Sidebar -->
                <div class="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20 shadow-xl">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold dark:text-white">Properties</h3>
                            <button id="sb-cancel" class="text-sm text-gray-500 hover:text-black dark:hover:text-white">Exit</button>
                        </div>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Scenario Name</label>
                                <input id="sb-name" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white" value="${scenarioData?.name || ''}">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                <textarea id="sb-desc" class="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-white" rows="2">${scenarioData?.description || ''}</textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correct Diagnosis</label>
                                <select id="sb-diag" class="w-full" placeholder="Select diagnosis...">
                                    <option value="">Select...</option>
                                    ${diagnoses.map(d => `<option value="${d.id}" ${scenarioData?.correctDiagnosis?.id === d.id ? 'selected' : ''}>${d.condition?.name || d.id}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Toolbox</div>
                        <div class="grid gap-3">
                            <!-- Standard Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition flex items-center gap-2" draggable="true" data-node="dialogue">
                                <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                                <span class="text-sm font-medium dark:text-gray-200">Dialogue Node</span>
                            </div>
                            <!-- End Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-3 rounded border border-red-200 dark:border-red-900 shadow-sm hover:shadow-md transition flex items-center gap-2" draggable="true" data-node="end">
                                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                                <span class="text-sm font-medium dark:text-gray-200">End Node</span>
                            </div>
                        </div>
                        <div class="mt-6 text-xs text-gray-400 space-y-2">
                            <p>1. <span class="text-green-600 font-bold">Green</span>: Start Node (Bot starts here).</p>
                            <p>2. <span class="text-red-500 font-bold">Red</span>: End Node (Terminates session).</p>
                            <p>3. Drag from <span class="font-bold text-gray-500">Grey Dot</span> to <span class="font-bold text-blue-500">Blue Dot</span> to connect.</p>
                        </div>
                    </div>

                    <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <button id="sb-save" class="w-full bg-[#5B3E86] text-white py-2 rounded-lg font-medium hover:bg-[#4a326c] transition shadow-lg">Save Scenario</button>
                    </div>
                </div>

                <!-- Canvas -->
                <div id="drawflow" class="flex-1 bg-gray-200 dark:bg-black relative overflow-hidden parent-drawflow"></div>
            </div>
        `;

        new TomSelect('#sb-diag', { create: false });

        const id_div = document.getElementById("drawflow")!;
        this.editor = new Drawflow(id_div);
        this.editor.reroute = true;
        this.editor.editor_mode = 'edit';
        this.editor.zoom_max = 3;
        this.editor.zoom_min = 0.3;
        this.editor.start();

        // --- GRAPH REBUILDING LOGIC ---
        if (id && scenarioData?.nodes) {
            const dbIdToDrawflowId = new Map<number, number>();

            // Create all nodes
            scenarioData.nodes.forEach((n: any) => {
                let type: NodeType = 'dialogue';
                if (n.isRoot) type = 'root';
                else if (n.isEndNode) type = 'end';

                const dfId = this.addNodeToCanvas(n.botText, n.x, n.y, type);
                dbIdToDrawflowId.set(n.id, dfId);
            });

            // Create connections and fill choice text
            scenarioData.nodes.forEach((n: any) => {
                const sourceDfId = dbIdToDrawflowId.get(n.id);
                if (!sourceDfId) return;

                const nodeEl = document.getElementById(`node-${sourceDfId}`)!;
                const choiceList = nodeEl.querySelector('.choices-list');

                // End nodes don't have choices
                if (!choiceList) return;

                // Re-create outputs and connections
                n.choices.forEach((choice: any, index: number) => {
                    const targetDfId = dbIdToDrawflowId.get(choice.targetNodeId);
                    
                    this.editor.addNodeOutput(sourceDfId);
                    const outputName = `output_${index + 1}`;

                    const row = document.createElement('div');
                    row.className = "flex items-center h-[34px]"; 
                    row.innerHTML = `<input type="text" class="w-full text-xs px-2 py-1 h-full border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" value="${choice.text}" data-output="${outputName}">`;
                    choiceList.appendChild(row);
                    row.querySelector('input')!.addEventListener('mousedown', (e) => e.stopPropagation());

                    if (targetDfId) {
                        this.editor.addConnection(sourceDfId, targetDfId, outputName, "input_1");
                    }
                });
            });

        } else {
            // Create start and end nodes automatically
            this.addNodeToCanvas('Hello. I am here to help. How are you feeling today?', 100, 200, 'root');
            this.addNodeToCanvas('Thank you for sharing. We will stop here for today.', 700, 200, 'end');
        }

        this.setupEvents();
        this.setupCustomPanning(id_div);
    }

    private setupCustomPanning(container: HTMLElement) {
        let isPanning = false;
        let startX = 0;
        let startY = 0;
        let initialCanvasX = 0;
        let initialCanvasY = 0;

        container.addEventListener('mousedown', (e) => {
            if (e.target === container || (e.target as HTMLElement).classList.contains('parent-drawflow')) {
                isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                initialCanvasX = this.editor.canvas_x;
                initialCanvasY = this.editor.canvas_y;
                container.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            this.editor.canvas_x = initialCanvasX + dx;
            this.editor.canvas_y = initialCanvasY + dy;
            this.editor.precanvas.style.transform = `translate(${this.editor.canvas_x}px, ${this.editor.canvas_y}px) scale(${this.editor.zoom})`;
        });

        window.addEventListener('mouseup', () => {
            isPanning = false;
            container.style.cursor = 'grab';
        });
    }

    private setupEvents() {
        const dragItems = document.querySelectorAll('.drag-item');
        let draggedType: NodeType = 'dialogue';

        dragItems.forEach(item => {
            item.addEventListener('dragstart', (e: any) => { 
                draggedType = e.target.dataset.node as NodeType; 
            });
        });

        const container = document.getElementById('drawflow')!;
        container.addEventListener('dragover', (e) => e.preventDefault());
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.editor.canvas_x) / this.editor.zoom;
            const y = (e.clientY - rect.top - this.editor.canvas_y) / this.editor.zoom;
            
            this.addNodeToCanvas('', x, y, draggedType);
        });

        document.getElementById('sb-save')?.addEventListener('click', () => this.saveGraph());
        document.getElementById('sb-cancel')?.addEventListener('click', this.onBack);
    }

    private addNodeToCanvas(initialText: string, x: number, y: number, type: NodeType): number {
        const isRoot = type === 'root';
        const isEnd = type === 'end';

        // Styles
        let borderColor = 'border-gray-200 dark:border-gray-700';
        let headerColor = 'text-gray-500';
        let title = 'DIALOGUE';

        if (isRoot) {
            borderColor = 'border-green-500 border-4';
            headerColor = 'text-green-600';
            title = 'START NODE';
        } else if (isEnd) {
            borderColor = 'border-red-500 border-4';
            headerColor = 'text-red-500';
            title = 'END NODE';
        }

        // HTML content
        const html = `
            <div class="node-wrapper node-content bg-white dark:bg-gray-800 rounded-lg shadow-lg ${borderColor} w-72 transition-colors duration-200" data-type="${type}">
                <div class="bg-gray-100 dark:bg-gray-900 p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-lg h-10 select-none">
                    <span class="text-xs font-bold uppercase ${headerColor}">${title}</span>
                    ${!isRoot ? '<button class="delete-node text-red-400 hover:text-red-600 font-bold px-2">×</button>' : ''}
                </div>
                <div class="p-3 select-none">
                    <label class="block text-[10px] uppercase text-gray-400 mb-1 font-semibold">Bot Says:</label>
                    <textarea df-botText class="w-full text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none resize-none h-24 font-normal" placeholder="${isEnd ? 'Closing remarks...' : 'Hello...'}">${initialText}</textarea>
                </div>
                ${!isEnd ? `
                <div class="p-3 pt-0 bg-white dark:bg-gray-800 rounded-b-lg">
                    <div class="choices-list flex flex-col gap-2"></div>
                    <button class="add-choice-btn mt-3 w-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium border border-transparent dark:border-gray-600 dashed-border">
                        + Add Choice
                    </button>
                </div>` : ''}
            </div>
        `;

        const nodeId = this.editor.addNode(type, 1, 0, x, y, `node-${type}`, {}, html);

        setTimeout(() => {
            const nodeEl = document.getElementById(`node-${nodeId}`);
            if(!nodeEl) return;
            
            // Delete logic
            nodeEl.querySelector('.delete-node')?.addEventListener('click', () => {
                this.editor.removeNodeId(`node-${nodeId}`);
            });

            // Prevent drag on inputs
            nodeEl.querySelectorAll('input, textarea').forEach(el => {
                el.addEventListener('mousedown', (e) => e.stopPropagation());
            });

            // Add choice logic (Only for non-end nodes)
            const choiceBtn = nodeEl.querySelector('.add-choice-btn');
            const choiceList = nodeEl.querySelector('.choices-list');

            if (choiceBtn && choiceList) {
                choiceBtn.addEventListener('click', () => {
                    const existingOutputs = this.editor.getNodeFromId(nodeId).outputs;
                    const nextIndex = Object.keys(existingOutputs).length + 1;
                    const outputName = `output_${nextIndex}`;
                    
                    this.editor.addNodeOutput(nodeId);
                    
                    const row = document.createElement('div');
                    row.className = "flex items-center h-[34px]"; 
                    row.innerHTML = `<input type="text" class="w-full text-xs px-2 py-1 h-full border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" placeholder="Therapist response..." data-output="${outputName}">`;
                    
                    choiceList.appendChild(row);
                    row.querySelector('input')!.addEventListener('mousedown', (e) => e.stopPropagation());
                });
            }
        }, 0);

        return nodeId;
    }

    private async saveGraph() {
        const nameInput = document.getElementById('sb-name') as HTMLInputElement;
        const descInput = document.getElementById('sb-desc') as HTMLTextAreaElement;
        const diagInput = document.getElementById('sb-diag') as HTMLSelectElement;

        const name = nameInput.value;
        const description = descInput.value;
        const diagnosisId = Number(diagInput.value);

        if (!name || !diagnosisId) {
            alert("Please provide a Scenario Name and select a Correct Diagnosis.");
            return;
        }

        const exportData = this.editor.export();
        const nodes: any[] = [];

        for (const [id, node] of Object.entries(exportData.drawflow.Home.data) as any) {
            const nodeEl = document.getElementById(`node-${id}`);
            if (!nodeEl) continue;

            const botText = (nodeEl.querySelector('[df-botText]') as HTMLTextAreaElement).value;
            const typeAttr = nodeEl.querySelector('.node-wrapper')?.getAttribute('data-type');
            
            const isRoot = typeAttr === 'root';
            const isEndNode = typeAttr === 'end';

            const choices: any[] = [];

            // End nodes have no choices
            if (!isEndNode) {
                const choiceInputs = nodeEl.querySelectorAll('.choices-list input');
                choiceInputs.forEach((input: HTMLInputElement) => {
                    const text = input.value;
                    const outputKey = input.getAttribute('data-output'); 
                    
                    if (outputKey && node.outputs[outputKey]) {
                        const connections = node.outputs[outputKey].connections;
                        if (connections.length > 0) {
                            const targetNodeId = connections[0].node;
                            choices.push({ text, targetNodeId });
                        }
                    }
                });
            }

            nodes.push({ 
                id, 
                botText, 
                isRoot, 
                isEndNode, 
                x: node.pos_x, 
                y: node.pos_y, 
                choices 
            });
        }

        const payload = { name, description, diagnosisId, nodes };

        try {
            const endpoint = this.scenarioId ? `admin/scenarios/graph/${this.scenarioId}` : `admin/scenarios/graph`;
            const method = this.scenarioId ? 'PUT' : 'POST';

            const response = await fetch(`http://localhost:3000/${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('therabot_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Scenario Saved Successfully!");
                this.onBack();
            } else {
                const err = await response.json();
                alert("Error saving: " + err.message);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to connect to server.");
        }
    }
}