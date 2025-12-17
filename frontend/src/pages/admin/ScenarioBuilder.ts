import Drawflow from 'drawflow';
import { AdminApi } from './api';
import TomSelect from 'tom-select';

type NodeType = 'root' | 'dialogue' | 'end';

export class ScenarioBuilder {
    private container: HTMLElement;
    private editor: any;
    private scenarioId: number | null = null;
    private onBack: () => void;
    
    // Grid Snap State
    private isSnapEnabled: boolean = true;
    private readonly GRID_SIZE = 20;

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
                    <div class="p-5 border-b border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[50vh]">
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

                            <!-- NEW: Initial State Editor -->
                            <div class="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial State Variables</label>
                                <div id="sb-state-list" class="space-y-2 mb-2"></div>
                                <button id="sb-add-state" class="w-full text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 py-2 rounded-lg text-gray-500 hover:text-[#5B3E86] hover:border-[#5B3E86] transition">
                                    + Add Variable
                                </button>
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
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Dialogue</span>
                                    <span class="text-[10px] text-gray-500">Bot speaks & waits</span>
                                </div>
                            </div>

                            <!-- Observation Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="observation">
                                <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 group-hover:text-white transition text-gray-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Observation</span>
                                    <span class="text-[10px] text-gray-500">Clinical context note</span>
                                </div>
                            </div>

                            <!-- State Update -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-200 dark:border-orange-900/30 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="state_update">
                                <div class="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition text-orange-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">State Update</span>
                                    <span class="text-[10px] text-gray-500">Modify hidden vars</span>
                                </div>
                            </div>

                            <!-- Randomizer -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-200 dark:border-purple-900/30 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="random">
                                <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition text-purple-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Randomizer</span>
                                    <span class="text-[10px] text-gray-500">% Chance outcomes</span>
                                </div>
                            </div>

                            <!-- Logic Node -->
                            <div class="drag-item cursor-grab active:cursor-grabbing bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-sm hover:shadow-md transition flex items-center gap-3 group" draggable="true" data-node="logic">
                                <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition text-blue-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">Logic Check</span>
                                    <span class="text-[10px] text-gray-500">Conditional path</span>
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
                    </div>

                    <div class="px-5 pt-3 pb-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Grid Snapping</span>
                            <button id="sb-snap-toggle" class="w-10 h-5 rounded-full relative transition-colors duration-200 ${this.isSnapEnabled ? 'bg-[#5B3E86]' : 'bg-gray-300'}">
                                <span id="sb-snap-knob" class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${this.isSnapEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
                            </button>
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

        // --- DRAWFLOW SETUP ---
        const id_div = document.getElementById("drawflow")!;
        this.editor = new Drawflow(id_div);
        this.editor.reroute = true;
        this.editor.editor_mode = 'edit';
        this.editor.zoom_max = 3;
        this.editor.zoom_min = 0.3;
        this.editor.start();

        this.editor.on('connectionCreated', (info: any) => {
            const { output_id, input_id, output_class, input_class } = info;
            const node = this.editor.getNodeFromId(output_id);
            const connections = node.outputs[output_class].connections;
            if (connections.length > 1) {
                const others = connections.filter((conn: any) => 
                    !(conn.node == input_id && conn.output == input_class)
                );
                others.forEach((conn: any) => {
                     this.editor.removeSingleConnection(output_id, conn.node, output_class, conn.output);
                });
            }
        });

        this.editor.on('nodeMoved', (id: any) => {
            if (!this.isSnapEnabled) return;
            const node = this.editor.getNodeFromId(id);
            const x = node.pos_x;
            const y = node.pos_y;
            const snapX = Math.round(x / this.GRID_SIZE) * this.GRID_SIZE;
            const snapY = Math.round(y / this.GRID_SIZE) * this.GRID_SIZE;
            this.editor.drawflow.drawflow.Home.data[id].pos_x = snapX;
            this.editor.drawflow.drawflow.Home.data[id].pos_y = snapY;
            const el = document.getElementById(`node-${id}`);
            if (el) {
                el.style.top = `${snapY}px`;
                el.style.left = `${snapX}px`;
            }
            this.editor.updateConnectionNodes(`node-${id}`);
        });

        // --- INITIAL STATE POPULATION ---
        const stateList = document.getElementById('sb-state-list')!;
        document.getElementById('sb-add-state')?.addEventListener('click', () => {
            this.addStateRow(stateList, '', 0);
        });

        if (scenarioData && scenarioData.initialState) {
            Object.entries(scenarioData.initialState).forEach(([key, val]) => {
                this.addStateRow(stateList, key, Number(val));
            });
        }

        // --- GRAPH REBUILDING ---
        if (id && scenarioData?.nodes) {
            const dbIdToDrawflowId = new Map<number, number>();

            scenarioData.nodes.forEach((n: any) => {
                let type: NodeType = 'dialogue';
                if (n.isRoot) type = 'root';
                else if (n.isEndNode) type = 'end';
                const dfId = this.addNodeToCanvas(n.botText, n.x, n.y, n.type || type, n.metadata);
                dbIdToDrawflowId.set(n.id, dfId);
            });

            scenarioData.nodes.forEach((n: any) => {
                const sourceDfId = dbIdToDrawflowId.get(n.id);
                if (!sourceDfId) return;
                const nodeEl = document.getElementById(`node-${sourceDfId}`)!;
                const choiceList = nodeEl.querySelector('.choices-list');
                if (!choiceList) return;

                n.choices.forEach((choice: any) => {
                    const targetDfId = dbIdToDrawflowId.get(choice.targetNodeId);
                    this.editor.addNodeOutput(sourceDfId);
                    const nodeObj = this.editor.getNodeFromId(sourceDfId);
                    const keys = Object.keys(nodeObj.outputs);
                    const outputName = keys[keys.length - 1]; 

                    const row = document.createElement('div');
                    row.className = "flex items-center h-[38px] gap-1 mb-0"; 
                    row.innerHTML = `
                        <input type="text" class="flex-1 min-w-0 text-xs px-3 py-2 h-full border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition shadow-sm" value="${choice.text}" data-output="${outputName}">
                        <button class="remove-choice-btn w-[30px] h-[30px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Remove Choice">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    `;
                    choiceList.appendChild(row);
                    row.querySelector('input')!.addEventListener('mousedown', (e) => e.stopPropagation());
                    row.querySelector('.remove-choice-btn')!.addEventListener('click', () => {
                        this.removeChoice(sourceDfId, outputName, row);
                    });
                    if (targetDfId) {
                        this.editor.addConnection(sourceDfId, targetDfId, outputName, "input_1");
                    }
                });
            });
        } else {
            this.addNodeToCanvas('Hello. I am here to help.', 100, 200, 'root');
            this.addNodeToCanvas('Session ended.', 700, 200, 'end');
        }

        this.setupEvents();
        this.setupCustomPanning(id_div);
    }

    private addStateRow(container: HTMLElement, key: string, val: number) {
        const row = document.createElement('div');
        row.className = "flex items-center gap-2 state-row";
        row.innerHTML = `
            <input type="text" placeholder="Var Name" value="${key}" class="state-key flex-1 w-0 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:border-[#5B3E86]">
            <input type="number" placeholder="0" value="${val}" class="state-val w-16 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs dark:text-white outline-none focus:border-[#5B3E86]">
            <button class="text-gray-400 hover:text-red-500 remove-state">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        row.querySelector('.remove-state')?.addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    private removeChoice(nodeId: number, outputName: string, row: HTMLElement) {
        const node = this.editor.getNodeFromId(nodeId);
        if (!node) { row.remove(); return; }
        const outputs = node.outputs;
        if (!outputs || !outputs[outputName]) { row.remove(); return; }

        const keys = Object.keys(outputs);
        const lastKey = keys[keys.length - 1];

        if (outputName === lastKey) {
            this.editor.removeNodeOutput(nodeId, outputName);
            row.remove();
            return;
        }

        const targetConnections = outputs[outputName].connections;
        if(targetConnections) {
            [...targetConnections].forEach((conn: any) => {
                 this.editor.removeSingleConnection(nodeId, conn.node, outputName, conn.output);
            });
        }

        const lastConnections = outputs[lastKey].connections;
        if(lastConnections) {
            [...lastConnections].forEach((conn: any) => {
                 this.editor.addConnection(nodeId, conn.node, outputName, conn.output);
                 this.editor.removeSingleConnection(nodeId, conn.node, lastKey, conn.output);
            });
        }

        const nodeEl = document.getElementById(`node-${nodeId}`);
        const lastRowInput = nodeEl?.querySelector(`input[data-output="${lastKey}"]`);
        
        if (lastRowInput) {
             lastRowInput.setAttribute('data-output', outputName);
        } else {
             this.editor.removeNodeOutput(nodeId, outputName);
             row.remove();
             return;
        }

        row.remove();
        this.editor.removeNodeOutput(nodeId, lastKey);
        
        if (lastRowInput) {
            const container = lastRowInput.parentElement!;
            const btn = container.querySelector('.remove-choice-btn')!;
            const newBtn = btn.cloneNode(true);
            btn.parentNode?.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                this.removeChoice(nodeId, outputName, container as HTMLElement);
            });
        }
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
        let draggedType: string = 'dialogue';

        dragItems.forEach(item => {
            item.addEventListener('dragstart', (e: any) => { 
                draggedType = e.target.dataset.node; 
            });
        });

        const container = document.getElementById('drawflow')!;
        container.addEventListener('dragover', (e) => e.preventDefault());
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            let x = (e.clientX - rect.left - this.editor.canvas_x) / this.editor.zoom;
            let y = (e.clientY - rect.top - this.editor.canvas_y) / this.editor.zoom;
            if (this.isSnapEnabled) {
                x = Math.round(x / this.GRID_SIZE) * this.GRID_SIZE;
                y = Math.round(y / this.GRID_SIZE) * this.GRID_SIZE;
            }
            this.addNodeToCanvas('', x, y, draggedType);
        });

        document.getElementById('sb-save')?.addEventListener('click', () => this.saveGraph());
        document.getElementById('sb-cancel')?.addEventListener('click', this.onBack);

        const toggleBtn = document.getElementById('sb-snap-toggle');
        toggleBtn?.addEventListener('click', () => {
            this.isSnapEnabled = !this.isSnapEnabled;
            const knob = document.getElementById('sb-snap-knob');
            if (this.isSnapEnabled) {
                toggleBtn.classList.remove('bg-gray-300');
                toggleBtn.classList.add('bg-[#5B3E86]');
                knob?.classList.remove('translate-x-0');
                knob?.classList.add('translate-x-5');
            } else {
                toggleBtn.classList.add('bg-gray-300');
                toggleBtn.classList.remove('bg-[#5B3E86]');
                knob?.classList.add('translate-x-0');
                knob?.classList.remove('translate-x-5');
            }
        });
    }

    private addNodeToCanvas(initialText: string, x: number, y: number, type: string, savedMetadata?: any): number {
        const isRoot = type === 'root';
        const isEnd = type === 'end';
        const isLogic = type === 'logic';
        const isState = type === 'state_update';
        const isRandom = type === 'random';
        const isObservation = type === 'observation';

        let wrapperClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl';
        let headerClass = 'bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500';
        let title = 'Dialogue Node';
        let icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>`;
        let contentHtml = '';
        let btnText = '+ Add Therapist Option';

        if (isRoot) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-green-400 ring-2 ring-green-100 dark:ring-green-900 shadow-2xl';
            headerClass = 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 text-green-700 dark:text-green-400';
            title = 'Start Node';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`;
            contentHtml = `<div class="p-4 select-none"><label class="block text-[10px] uppercase text-gray-400 mb-2 font-bold tracking-wide">Opening Line</label><textarea df-botText class="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:border-[#5B3E86] transition resize-none h-24 font-normal shadow-inner leading-relaxed" placeholder="Enter bot response...">${initialText}</textarea></div>`;
        } 
        else if (isEnd) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-red-400 ring-2 ring-red-100 dark:ring-red-900 shadow-2xl';
            headerClass = 'bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-red-700 dark:text-red-400';
            title = 'End Node';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>`;
            contentHtml = `<div class="p-4 select-none"><label class="block text-[10px] uppercase text-gray-400 mb-2 font-bold tracking-wide">Closing Remarks</label><textarea df-botText class="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:border-[#5B3E86] transition resize-none h-24 font-normal shadow-inner leading-relaxed" placeholder="Session ended...">${initialText}</textarea></div>`;
        } 
        else if (isObservation) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-gray-400 border-l-4 shadow-lg';
            headerClass = 'bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300';
            title = 'Clinical Observation';
            btnText = '+ Add Next Step';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
            contentHtml = `<div class="p-4 select-none"><label class="block text-[10px] uppercase text-gray-400 mb-2 font-bold tracking-wide">Context Note (Internal)</label><textarea df-botText class="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-gray-300 italic outline-none focus:border-gray-400 transition resize-none h-20 font-normal bg-gray-50" placeholder="e.g. Patient avoids eye contact...">${initialText}</textarea></div>`;
        }
        else if (isState) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-orange-400 ring-2 ring-orange-100 dark:ring-orange-900 shadow-xl';
            headerClass = 'bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400';
            title = 'State Update';
            btnText = '+ Add Next Step';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
            
            const v = savedMetadata?.variable || '';
            const val = savedMetadata?.value || '';
            const op = savedMetadata?.operator || 'add';

            contentHtml = `
                <div class="p-4 select-none space-y-3">
                    <div class="flex gap-2">
                         <div class="flex-1">
                            <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Variable</label>
                            <input df-metadata-var type="text" value="${v}" class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white" placeholder="e.g. trust">
                        </div>
                        <div class="w-1/3">
                             <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Operation</label>
                             <select df-metadata-op class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white">
                                <option value="add" ${op === 'add' ? 'selected' : ''}>Add (+)</option>
                                <option value="sub" ${op === 'sub' ? 'selected' : ''}>Sub (-)</option>
                                <option value="set" ${op === 'set' ? 'selected' : ''}>Set (=)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Value</label>
                        <input df-metadata-val type="number" value="${val}" class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white" placeholder="10">
                    </div>
                </div>`;
        }
        else if (isRandom) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-purple-400 ring-2 ring-purple-100 dark:ring-purple-900 shadow-xl';
            headerClass = 'bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400';
            title = 'Randomizer';
            btnText = '+ Add Outcome';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`;
            contentHtml = `<div class="p-4 select-none text-xs text-gray-500 italic">Define outcomes and probabilities below. Ensure they sum to roughly 100%.</div>`;
        }
        else if (isLogic) {
            wrapperClass = 'bg-white dark:bg-gray-800 border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900 shadow-xl';
            headerClass = 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400';
            title = 'Logic Check';
            btnText = '+ Add Condition Branch';
            icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            
            const v = savedMetadata?.variable || '';
            const val = savedMetadata?.value || '';
            const op = savedMetadata?.operator || '>';

            contentHtml = `
                <div class="p-4 select-none space-y-3">
                    <div>
                        <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Variable</label>
                        <input df-metadata-var type="text" value="${v}" class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white" placeholder="e.g. anxiety_level">
                    </div>
                    <div class="flex gap-2">
                        <div class="w-1/3">
                            <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Op</label>
                            <select df-metadata-op class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white">
                                <option value=">" ${op === '>' ? 'selected' : ''}>></option>
                                <option value="<" ${op === '<' ? 'selected' : ''}><</option>
                                <option value="==" ${op === '==' ? 'selected' : ''}>==</option>
                            </select>
                        </div>
                        <div class="flex-1">
                            <label class="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Value</label>
                            <input df-metadata-val type="number" value="${val}" class="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white" placeholder="50">
                        </div>
                    </div>
                </div>`;
        }
        else {
            contentHtml = `<div class="p-4 select-none"><label class="block text-[10px] uppercase text-gray-400 mb-2 font-bold tracking-wide">AI Response</label><textarea df-botText class="w-full text-sm p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-900 dark:text-white outline-none focus:border-[#5B3E86] transition resize-none h-24 font-normal shadow-inner leading-relaxed" placeholder="Enter bot response...">${initialText}</textarea></div>`;
        }

        const html = `
            <div class="node-wrapper node-content rounded-2xl ${wrapperClass} w-80 transition-all duration-200 overflow-hidden" data-type="${type}">
                <div class="p-3 ${headerClass} flex justify-between items-center select-none">
                    <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-wider overflow-hidden">
                        <span class="flex-shrink-0 w-4 h-4 flex items-center justify-center">${icon}</span>
                        <span class="flex-1 truncate">${title}</span>
                    </div>
                    ${!isRoot ? '<button class="delete-node text-gray-400 hover:text-red-500 transition px-2 font-bold text-lg leading-none">&times;</button>' : ''}
                </div>
                ${contentHtml}
                ${(!isEnd) ? `
                <div class="px-4 pb-4 pt-0">
                    <div class="choices-list flex flex-col gap-2"></div>
                    <button class="add-choice-btn mt-3 w-full text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#5B3E86] dark:hover:text-white transition border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer">
                        ${btnText}
                    </button>
                </div>` : ''}
            </div>
        `;
        
        const inputsCount = isRoot ? 0 : 1;
        const nodeId = this.editor.addNode(type, inputsCount, 0, x, y, `node-${type}`, {}, html);
        
        setTimeout(() => {
             const nodeEl = document.getElementById(`node-${nodeId}`);
             if(nodeEl) {
                nodeEl.querySelector('.delete-node')?.addEventListener('click', () => {
                    this.editor.removeNodeId(`node-${nodeId}`);
                });
                nodeEl.querySelectorAll('input, textarea, select').forEach(el => {
                    el.addEventListener('mousedown', (e) => e.stopPropagation());
                });
                
                const choiceBtn = nodeEl.querySelector('.add-choice-btn');
                const choiceList = nodeEl.querySelector('.choices-list');
                if (choiceBtn && choiceList) {
                    choiceBtn.addEventListener('click', () => {
                        this.editor.addNodeOutput(nodeId);
                        const nodeObj = this.editor.getNodeFromId(nodeId);
                        const keys = Object.keys(nodeObj.outputs);
                        const outputName = keys[keys.length - 1];
                        
                        const row = document.createElement('div');
                        row.className = "flex items-center h-[38px] gap-1 animate-fade-in-up mb-0"; 
                        
                        let placeholder = 'Option text...';
                        if(isLogic) placeholder = 'Condition (e.g. True)';
                        if(isRandom) placeholder = 'Outcome (e.g. 50% Success)';
                        if(isObservation || isState) placeholder = 'Continue';

                        row.innerHTML = `
                            <input type="text" class="flex-1 min-w-0 text-xs px-3 py-2 h-full border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#5B3E86] transition shadow-sm" placeholder="${placeholder}" data-output="${outputName}">
                            <button class="remove-choice-btn w-[30px] h-[30px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Remove">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        `;
                        choiceList.appendChild(row);
                        row.querySelector('input')!.addEventListener('mousedown', (e) => e.stopPropagation());
                        row.querySelector('.remove-choice-btn')!.addEventListener('click', () => {
                            const outputs = this.editor.getNodeFromId(nodeId).outputs;
                            if(outputs[outputName]) this.editor.removeNodeOutput(nodeId, outputName);
                            row.remove();
                        });
                    });
                }
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

        const initialState: any = {};
        document.querySelectorAll('.state-row').forEach(row => {
            const key = (row.querySelector('.state-key') as HTMLInputElement).value.trim();
            const val = Number((row.querySelector('.state-val') as HTMLInputElement).value);
            if (key) {
                initialState[key] = val;
            }
        });

        if (!name || !conditionId) {
            alert("Please provide a Scenario Name and select a Correct Diagnosis.");
            return;
        }

        const exportData = this.editor.export();
        const nodes: any[] = [];

        for (const [id, node] of Object.entries(exportData.drawflow.Home.data) as any) {
            const nodeEl = document.getElementById(`node-${id}`);
            if (!nodeEl) continue;

            const typeAttr = nodeEl.querySelector('.node-wrapper')?.getAttribute('data-type');
            
            const botTextEl = nodeEl.querySelector('[df-botText]') as HTMLTextAreaElement;
            const botText = botTextEl ? botTextEl.value : '';

            let metadata: any = null;
            const varInput = nodeEl.querySelector('[df-metadata-var]') as HTMLInputElement;
            const valInput = nodeEl.querySelector('[df-metadata-val]') as HTMLInputElement;
            const opInput = nodeEl.querySelector('[df-metadata-op]') as HTMLSelectElement;

            if (varInput || valInput || opInput) {
                metadata = {};
                if (varInput) metadata.variable = varInput.value;
                if (valInput) metadata.value = valInput.value;
                if (opInput) metadata.operator = opInput.value;
            }

            const isRoot = typeAttr === 'root';
            const isEndNode = typeAttr === 'end';
            const type = typeAttr || 'dialogue'; 

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
                type,        
                botText, 
                metadata,    
                isRoot, 
                isEndNode, 
                x: node.pos_x, 
                y: node.pos_y, 
                choices 
            });
        }

        const payload = { name, description, conditionId, initialState, nodes };

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