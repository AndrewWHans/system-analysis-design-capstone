import { BaseRepository } from "../repository/BaseRepository";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { BadRequestError, NotFoundError } from "../utils/AppError";
import { AppDataSource } from "../data-source";
import { EntityManager } from "typeorm";

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
    conditionId: number; 
    nodes: GraphNode[];
}

export class ScenarioService {
    constructor(
        private scenarioRepository: BaseRepository<ScenarioEntity>,
        private dialogueNodeRepository: BaseRepository<DialogueNodeEntity>,
        private therapistChoiceRepository: BaseRepository<TherapistChoiceEntity>,
        private conditionRepository: BaseRepository<ConditionEntity>
    ) {}

    // Read operations

    async getScenarioByID(scenarioID: number): Promise<any> {
        const scenario = await this.scenarioRepository.repo.findOne({
            where: { id: scenarioID },
            relations: ["correctDiagnosis", "rootDialogueNode"]
        });

        if (!scenario) throw new NotFoundError("Scenario not found");

        const nodes = await this.dialogueNodeRepository.repo.find({
            where: { scenario: { id: scenarioID } },
            relations: ["therapistChoices", "therapistChoices.nextNode"],
            order: { therapistChoices: { orderIndex: "ASC" } }
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

    async deleteScenario(scenarioID: number): Promise<void> {
        const scenario = await this.scenarioRepository.repo.findOne({ 
            where: { id: scenarioID } 
        });

        if (!scenario) throw new NotFoundError("Scenario not found");

        // Break circular dependency before deletion
        scenario.rootDialogueNode = null as any;
        await this.scenarioRepository.repo.save(scenario);

        await this.scenarioRepository.repo.remove(scenario);
    }

    // Write operation

    async saveScenarioGraph(scenarioId: number | null, data: GraphPayload): Promise<ScenarioEntity> {
        this.validateGraphConnectivity(data.nodes);
        if (!data.name?.trim()) throw new BadRequestError("Scenario Name is required");
        if (!data.conditionId) throw new BadRequestError("A correct condition is required");

        return await AppDataSource.transaction(async (manager) => {
            // Prepare scenario container
            const scenario = await this.upsertScenarioMetadata(manager, scenarioId, data);

            // Clean up old graph data if updating
            if (scenarioId) {
                await this.clearExistingGraph(manager, scenarioId);
            }

            // Create new nodes
            const { idMap, rootNode } = await this.persistNodes(manager, scenario, data.nodes);

            // Create connections (edges)
            await this.persistConnections(manager, data.nodes, idMap);

            // Finalize root
            return await this.finalizeScenario(manager, scenario, rootNode);
        });
    }

    // Helper methods

    private async upsertScenarioMetadata(manager: EntityManager, id: number | null, data: GraphPayload): Promise<ScenarioEntity> {
        let scenario: ScenarioEntity;

        if (id) {
            scenario = await manager.findOne(ScenarioEntity, { 
                where: { id },
                relations: ["rootDialogueNode"] 
            }) as ScenarioEntity;
            if (!scenario) throw new BadRequestError("Scenario not found");
        } else {
            scenario = new ScenarioEntity();
        }

        scenario.name = data.name;
        scenario.description = data.description || "";
        
        const condition = await manager.findOne(ConditionEntity, { where: { id: data.conditionId } });
        if (!condition) throw new BadRequestError("Invalid Condition ID");
        scenario.correctDiagnosis = condition;

        return await manager.save(ScenarioEntity, scenario);
    }

    private async clearExistingGraph(manager: EntityManager, scenarioId: number): Promise<void> {
        // Unlink root to prevent FK constraint failure
        await manager.update(ScenarioEntity, { id: scenarioId }, { rootDialogueNode: null as any });
        // Delete all nodes belonging to this scenario (cascades choices)
        await manager.delete(DialogueNodeEntity, { scenario: { id: scenarioId } });
    }

    private async persistNodes(
        manager: EntityManager, 
        scenario: ScenarioEntity, 
        nodes: GraphNode[]
    ): Promise<{ idMap: Map<string, DialogueNodeEntity>, rootNode: DialogueNodeEntity }> {
        
        const idMap = new Map<string, DialogueNodeEntity>();
        let rootNode: DialogueNodeEntity | null = null;

        for (const uiNode of nodes) {
            const nodeEntity = new DialogueNodeEntity();
            nodeEntity.botText = uiNode.botText || "...";
            nodeEntity.uiX = uiNode.x || 0;
            nodeEntity.uiY = uiNode.y || 0;
            nodeEntity.isEndNode = !!uiNode.isEndNode; 
            nodeEntity.scenario = scenario;
            
            const savedNode = await manager.save(DialogueNodeEntity, nodeEntity);
            idMap.set(uiNode.id, savedNode);

            if (uiNode.isRoot) rootNode = savedNode;
        }

        // Fallback root detection strategy
        if (!rootNode && nodes.length > 0) {
            const fallback = nodes.find(n => n.botText === "Start Here") || nodes[0];
            rootNode = idMap.get(fallback.id) || null;
        }

        if (!rootNode) throw new BadRequestError("Could not determine root node");

        return { idMap, rootNode };
    }

    private async persistConnections(
        manager: EntityManager, 
        nodes: GraphNode[], 
        idMap: Map<string, DialogueNodeEntity>
    ): Promise<void> {
        
        const choicesToSave: TherapistChoiceEntity[] = [];

        for (const uiNode of nodes) {
            const sourceEntity = idMap.get(uiNode.id);
            if (!sourceEntity || !uiNode.choices) continue;

            uiNode.choices.forEach((choice, index) => {
                const targetEntity = idMap.get(choice.targetNodeId);
                if (targetEntity) {
                    const choiceEntity = new TherapistChoiceEntity();
                    choiceEntity.text = choice.text || "Continue";
                    choiceEntity.sourceNode = sourceEntity;
                    choiceEntity.nextNode = targetEntity;
                    choiceEntity.orderIndex = index;
                    choicesToSave.push(choiceEntity);
                }
            });
        }

        if (choicesToSave.length > 0) {
            await manager.save(TherapistChoiceEntity, choicesToSave);
        }
    }

    private async finalizeScenario(
        manager: EntityManager, 
        scenario: ScenarioEntity, 
        rootNode: DialogueNodeEntity
    ): Promise<ScenarioEntity> {
        scenario.rootDialogueNode = rootNode;
        const result = await manager.save(ScenarioEntity, scenario);
        
        // Clean up circular object structure for JSON response
        if (result.rootDialogueNode) {
            // @ts-ignore
            delete result.rootDialogueNode.scenario;
        }
        return result;
    }

    private validateGraphConnectivity(nodes: GraphNode[]) {
        if (!nodes || nodes.length === 0) throw new BadRequestError("Scenario must have at least one node.");

        const root = nodes.find(n => n.isRoot);
        const endNodes = nodes.filter(n => n.isEndNode);

        if (!root) throw new BadRequestError("Scenario must have a Start Node (Root).");
        if (endNodes.length === 0) throw new BadRequestError("Scenario must have at least one End Node.");

        // BFS to find all reachable nodes from Root
        const adjList = new Map<string, string[]>();
        nodes.forEach(n => {
            const targets = (n.choices || [])
                .map(c => c.targetNodeId)
                .filter(id => id);
            adjList.set(n.id, targets);
        });

        const visited = new Set<string>();
        const queue: string[] = [root.id];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const neighbors = adjList.get(currentId) || [];
            neighbors.forEach(nId => queue.push(nId));
        }

        // Validate that *all* defined End Nodes are reachable
        const unreachableEndNodes = endNodes.filter(en => !visited.has(en.id));

        if (unreachableEndNodes.length > 0) {
            throw new BadRequestError(`Graph Error: ${unreachableEndNodes.length} End Node(s) are not reachable from the Start Node.`);
        }
    }
}