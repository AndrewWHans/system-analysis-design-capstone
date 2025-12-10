import { BaseRepository } from "../repository/BaseRepository";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { BadRequestError, NotFoundError } from "../utils/AppError";
import { AppDataSource } from "../data-source";

export interface GraphNode {
    id: string; 
    botText: string;
    isRoot: boolean;
    isEndNode: boolean; 
    x: number;
    y: number;
    choices: {
        text: string;
        targetNodeId: string; 
    }[];
}

export interface GraphPayload {
    name: string;
    description: string;
    diagnosisId: number;
    nodes: GraphNode[];
}

export class ScenarioService {
    constructor(
        private scenarioRepository: BaseRepository<ScenarioEntity>,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>
    ) {}

    async getScenarioByID(scenarioID: number): Promise<any> {
        const scenario = await this.scenarioRepository.repo.findOne({
            where: { id: scenarioID },
            relations: ["correctDiagnosis", "correctDiagnosis.condition", "rootDialogueNode"]
        });

        if (!scenario) throw new NotFoundError("Scenario not found");

        const nodes = await this.dialogueNodeRepository.repo.find({
            where: { scenario: { id: scenarioID } },
            relations: ["therapistChoices", "therapistChoices.nextNode"],
            order: {
                therapistChoices: {
                    orderIndex: "ASC"
                }
            }
        });

        return {
            ...scenario,
            nodes: nodes.map(n => ({
                id: n.id,
                botText: n.botText,
                isRoot: n.id === scenario.rootDialogueNode?.id,
                isEndNode: n.isEndNode,
                x: n.uiX,
                y: n.uiY,
                choices: n.therapistChoices.map(c => ({
                    id: c.id,
                    text: c.text,
                    targetNodeId: c.nextNode?.id
                }))
            }))
        };
    }

    async getScenarioByName(scenarioName: string): Promise<ScenarioEntity> {
        return await this.scenarioRepository.findByName(scenarioName);
    }

    async getAllScenarios(): Promise<ScenarioEntity[]> {
        return await this.scenarioRepository.findAll();
    }

    async saveScenarioGraph(scenarioId: number | null, data: GraphPayload): Promise<ScenarioEntity> {
        // Pre-validation
        this.validateGraphConnectivity(data.nodes);

        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            if (!data.name?.trim()) throw new BadRequestError("Scenario Name is required");
            if (!data.diagnosisId) throw new BadRequestError("A correct diagnosis is required");

            let scenario: ScenarioEntity;

            // Create or retrieve scenario
            if (scenarioId) {
                scenario = await transactionalEntityManager.findOne(ScenarioEntity, { 
                    where: { id: scenarioId },
                    relations: ["rootDialogueNode"] 
                }) as ScenarioEntity;
                
                if (!scenario) throw new BadRequestError("Scenario not found");

                // Unlink root node to prevent FK error during delete
                scenario.rootDialogueNode = null as any; 
                await transactionalEntityManager.save(ScenarioEntity, scenario);

                // Delete old nodes
                await transactionalEntityManager.delete(DialogueNodeEntity, { scenario: { id: scenarioId } });
            } else {
                scenario = new ScenarioEntity();
            }

            // Update scenario data
            scenario.name = data.name;
            scenario.description = data.description || "";
            
            const diagnosis = await transactionalEntityManager.findOne(DiagnosisEntity, { where: { id: data.diagnosisId } });
            if (!diagnosis) throw new BadRequestError("Invalid Diagnosis ID");
            scenario.correctDiagnosis = diagnosis;

            // Save scenario
            const savedScenario = await transactionalEntityManager.save(ScenarioEntity, scenario);

            // Create nodes
            const uiIdToEntityMap = new Map<string, DialogueNodeEntity>();
            let rootNode: DialogueNodeEntity | null = null;

            for (const uiNode of data.nodes) {
                const nodeEntity = new DialogueNodeEntity();
                nodeEntity.botText = uiNode.botText || "...";
                nodeEntity.uiX = uiNode.x || 0;
                nodeEntity.uiY = uiNode.y || 0;
                nodeEntity.isEndNode = !!uiNode.isEndNode; // Save End Node State
                nodeEntity.scenario = savedScenario;
                
                const savedNode = await transactionalEntityManager.save(DialogueNodeEntity, nodeEntity);
                uiIdToEntityMap.set(uiNode.id, savedNode);

                if (uiNode.isRoot) rootNode = savedNode;
            }

            // Fallback root detection
            if (!rootNode && data.nodes.length > 0) {
                const startNode = data.nodes.find(n => n.botText === "Start Here") || data.nodes[0];
                rootNode = uiIdToEntityMap.get(startNode.id) || null;
            }
            if (!rootNode) throw new BadRequestError("Could not determine root node");

            // Create connections
            for (const uiNode of data.nodes) {
                const sourceEntity = uiIdToEntityMap.get(uiNode.id);
                if (!sourceEntity) continue;

                if (uiNode.choices && uiNode.choices.length > 0) {
                    for (let i = 0; i < uiNode.choices.length; i++) {
                        const choice = uiNode.choices[i];
                        const targetEntity = uiIdToEntityMap.get(choice.targetNodeId);
                        
                        if (targetEntity) {
                            const choiceEntity = new TherapistChoiceEntity();
                            choiceEntity.text = choice.text || "Continue";
                            choiceEntity.sourceNode = sourceEntity;
                            choiceEntity.nextNode = targetEntity;
                            choiceEntity.orderIndex = i;
                            await transactionalEntityManager.save(TherapistChoiceEntity, choiceEntity);
                        }
                    }
                }
            }

            // Finalize
            savedScenario.rootDialogueNode = rootNode;
            const finalScenario = await transactionalEntityManager.save(ScenarioEntity, savedScenario);

            if (finalScenario.rootDialogueNode) {
                // @ts-ignore
                delete finalScenario.rootDialogueNode.scenario;
            }

            return finalScenario;
        });
    }

    async deleteScenario(scenarioID: number): Promise<void> {
        const scenario = await this.scenarioRepository.repo.findOne({ 
            where: { id: scenarioID } 
        });

        if (!scenario) throw new NotFoundError("Scenario not found");

        scenario.rootDialogueNode = null as any;
        await this.scenarioRepository.repo.save(scenario);

        await this.scenarioRepository.repo.remove(scenario);
    }

    /**
     * Validates that the graph is logical:
     * 1. Has a root node.
     * 2. Has at least one end Node.
     * 3. A path exists from root -> end Node.
     */
    private validateGraphConnectivity(nodes: GraphNode[]) {
        if (!nodes || nodes.length === 0) throw new BadRequestError("Scenario must have at least one node.");

        // 1. Identify root and end Nodes
        const root = nodes.find(n => n.isRoot);
        const endNodes = nodes.filter(n => n.isEndNode);

        if (!root) throw new BadRequestError("Scenario must have a Start Node (Root).");
        if (endNodes.length === 0) throw new BadRequestError("Scenario must have at least one End Node to finish the session.");

        // 2. Build Adjacency List for traversal
        // Map<NodeID, Array<TargetNodeID>>
        const adjList = new Map<string, string[]>();
        
        nodes.forEach(n => {
            const targets = n.choices
                .map(c => c.targetNodeId)
                .filter(id => id !== undefined && id !== null);
            adjList.set(n.id, targets);
        });

        // 3. Confirm that start node can reach end node.
        const visited = new Set<string>();
        const queue: string[] = [root.id];
        let canReachEnd = false;

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            // Check if current node is an End Node
            if (endNodes.some(en => en.id == currentId)) {
                canReachEnd = true;
                break; // We found one valid path, scenario is valid.
            }

            // Add neighbors to queue
            const neighbors = adjList.get(currentId) || [];
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    queue.push(neighborId);
                }
            }
        }

        if (!canReachEnd) {
            throw new BadRequestError("Invalid Scenario: The Start Node is not connected to any End Node. Please create a path.");
        }
    }
}