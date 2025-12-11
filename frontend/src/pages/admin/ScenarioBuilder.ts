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
        
        const conditions = await AdminApi.getAll('conditions');
        let scenarioData: any = null;
        if (id) {
            scenarioData = await AdminApi.getOne('scenarios', id);
        }

        this.container.innerHTML = `
            <div class="flex h-[calc(100vh-140px)] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
                
                <!-- Editor Sidebar -->
                <div class="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20 shadow-sm relative">
                    
                    <!-- Header -->
                    <div class="p-5 border-b border-gray-100 dark:border-gray-800">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <svg class="w-5 h-5 text-[#5B3E86]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Scenario Props
                            </h3>
                            <button id="sb-cancel" class="text-xs font-bold text-gray-400 hover:text-red-500 cursor-pointer transition uppercase tracking-wider">Close</button>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                                <input id="sb-name" type="text" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition" value="${scenarioData?.name || ''}" placeholder="e.g. Anxiety Case 1">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea id="sb-desc" class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition resize-none" rows="2" placeholder="Brief context...">${scenarioData?.description || ''}</textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Diagnosis</label>
                                <select id="sb-diag" class="w-full" placeholder="Select diagnosis...">
                                    <option value="">Select...</option>
                                    ${conditions.map(d => `<option value="${d.id}" ${scenarioData?.correctDiagnosis?.id === d.id ? 'selected' : ''}>${d.name || d.id}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Nodes Toolbox -->
                    <div class="flex-1 p-5 overflow-y-auto bg-gray-50/50 dark:bg-black/20">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Nodes Library</div>
                        <div class="grid gap-3">
                            <!-- Standard Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="dialogue">
                                <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-[#5B3E86] group-hover:text-white transition text-gray-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Dialogue Node</span>
                                    <span class="text-[10px] text-gray-500">Standard bot response</span>
                                </div>
                            </div>
                            <!-- End Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="end">
                                <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition text-red-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">End Session</span>
                                    <span class="text-[10px] text-gray-500">Terminates the chat</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <h4 class="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Quick Tips
                            </h4>
                            <ul class="text-[10px] text-blue-700 dark:text-blue-400 space-y-1.5 list-disc pl-3">
                                <li><span class="font-bold">Green Node</span> is the Root (Start).</li>
                                <li>Connect <span class="font-bold">Grey Dot</span> (Output) to <span class="font-bold">Blue Dot</span> (Input).</li>
                                <li>Drag canvas to pan, ctrl + scroll to zoom.</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Footer Action -->
                    <div class="p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <button id="sb-save" class="w-full bg-[#5B3E86] text-white py-3 rounded-xl font-bold hover:bg-[#4a326c] transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            Save Scenario
                        </button>
                    </div>
                </div>

                <!-- Canvas -->
                <div id="drawflow" class="flex-1 bg-gray-100 dark:bg-black relative overflow-hidden parent-drawflow" 
                     style="background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px;">
                </div>
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

                if (!choiceList) return;

                n.choices.forEach((choice: any, index: number) => {
                    const targetDfId = dbIdToDrawflowId.get(choice.targetNodeId);
                    
                    this.editor.addNodeOutput(sourceDfId);
                    const outputName = `output_${index + 1}`;

                    const row = document.createElement('div');
                    row.className = "flex items-center h-[38px]"; 
                    row.innerHTML = `<input type="text" class="w-full text-xs px-3 py-2 h-full border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition shadow-sm" value="${choice.text}" data-output="${outputName}">`;
                    choiceList.appendChild(row);
                    row.querySelector('input')!.addEventListener('mousedown', (e) => e.stopPropagation());

                    if (targetDfId) {
                        this.editor.addConnection(sourceDfId, targetDfId, outputName, "input_1");
                    }
                });
            });

        } else {
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

        let wrapperClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl';
        let headerClass = 'bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500';
        let title = 'Dialogue Node';
        let icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>`;

        if (isRoot) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-green-400 ring-2 ring-green-100 dark:ring-green-900 shadow-2xl';
            headerClass = 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 text-green-700 dark:text-green-400';
            title = 'Start Node';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`;
        } else if (isEnd) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-red-400 ring-2 ring-red-100 dark:ring-red-900 shadow-2xl';
            headerClass = 'bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-red-700 dark:text-red-400';
            title = 'End Node';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>`;
        }

        // Updated header HTML to use spans and flex-shrink to prevent overlap
        const html = `
            <div class="node-wrapper node-content rounded-2xl ${wrapperClass} w-80 transition-all duration-200 overflow-hidden" data-type="${type}">
                <div class="p-3 ${headerClass} flex justify-between items-center select-none">
                    <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-wider overflow-hidden">
                        <span class="flex-shrink-0 w-4 h-4 flex items-center justify-center">${icon}</span>
                        <span class="flex-1 truncate">${title}</span>
                    </div>
                    ${!isRoot ? '<button class="delete-node text-gray-400 hover:text-red-500 transition px-2 font-bold text-lg leading-none">&times;</button>' : ''}
                </div>
                <div class="p-4 select-none">
                    <label class="block text-[10px] uppercase text-gray-400 mb-2 font-bold tracking-wide">AI Response</label>
                    <textarea df-botText class="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:border-[#5B3E86] transition resize-none h-24 font-normal shadow-inner leading-relaxed" placeholder="${isEnd ? 'Session ending remarks...' : 'Enter bot response...'}">${initialText}</textarea>
                </div>
                ${!isEnd ? `
                <div class="px-4 pb-4 pt-0">
                    <div class="choices-list flex flex-col gap-2"></div>
                    <button class="add-choice-btn mt-3 w-full text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#5B3E86] dark:hover:text-white transition border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer">
                        + Add Therapist Option
                    </button>
                </div>` : ''}
            </div>
        `;

        const nodeId = this.editor.addNode(type, 1, 0, x, y, `node-${type}`, {}, html);

        setTimeout(() => {
            const nodeEl = document.getElementById(`node-${nodeId}`);
            if(!nodeEl) return;
            
            nodeEl.querySelector('.delete-node')?.addEventListener('click', () => {
                this.editor.removeNodeId(`node-${nodeId}`);
            });

            nodeEl.querySelectorAll('input, textarea').forEach(el => {
                el.addEventListener('mousedown', (e) => e.stopPropagation());
            });

            const choiceBtn = nodeEl.querySelector('.add-choice-btn');
            const choiceList = nodeEl.querySelector('.choices-list');

            if (choiceBtn && choiceList) {
                choiceBtn.addEventListener('click', () => {
                    const existingOutputs = this.editor.getNodeFromId(nodeId).outputs;
                    const nextIndex = Object.keys(existingOutputs).length + 1;
                    const outputName = `output_${nextIndex}`;
                    
                    this.editor.addNodeOutput(nodeId);
                    
                    const row = document.createElement('div');
                    row.className = "flex items-center h-[38px] animate-fade-in-up"; 
                    row.innerHTML = `<input type="text" class="w-full text-xs px-3 py-2 h-full border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition shadow-sm" placeholder="Therapist choice..." data-output="${outputName}">`;
                    
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
        const conditionId = Number(diagInput.value);

        if (!name || !conditionId) {
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

            if (!isEndNode) {
                const choiceInputs = nodeEl.querySelectorAll<HTMLInputElement>('.choices-list input');

                choiceInputs.forEach((input) => {
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

        const payload = { name, description, conditionId, nodes };

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