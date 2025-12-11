import { ConditionEntity } from "../entity/ConditionEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";

export class SimulationService {
    /**
     * Determines the next state of the conversation based on the user's choice.
     */
    getNextState(choice: TherapistChoiceEntity): { nextNode: DialogueNodeEntity; botResponse: string } {
        const nextNode = choice.nextNode;
        
        return {
            nextNode: nextNode,
            botResponse: nextNode.botText
        };
    }

    /**
     * Updates the session context (variables) based on a STATE_UPDATE node.
     */
    applyStateUpdate(currentContext: any, metadata: any): any {
        const context = currentContext || {};
        const { variable, operator, value } = metadata || {};

        if (!variable) return context;

        const currentVal = Number(context[variable]) || 0;
        const paramVal = Number(value) || 0;

        let newVal = currentVal;

        switch (operator) {
            case "add":
                newVal = currentVal + paramVal;
                break;
            case "sub":
                newVal = currentVal - paramVal;
                break;
            case "set":
                newVal = paramVal;
                break;
            case "mult":
                newVal = currentVal * paramVal;
                break;
            default:
                break;
        }

        return { ...context, [variable]: newVal };
    }

    /**
     * Evaluates a Logic Node to see which path to take.
     * Returns the INDEX of the choice that should be followed.
     */
    evaluateLogic(context: any, metadata: any): boolean {
        const ctx = context || {};
        const { variable, operator, value } = metadata || {};

        if (!variable) return false;

        const currentVal = Number(ctx[variable]) || 0;
        const targetVal = Number(value) || 0;

        switch (operator) {
            case ">": return currentVal > targetVal;
            case "<": return currentVal < targetVal;
            case "==": return currentVal === targetVal;
            case ">=": return currentVal >= targetVal;
            case "<=": return currentVal <= targetVal;
            case "!=": return currentVal !== targetVal;
            default: return false;
        }
    }

    /**
     * Evaluates if a submitted diagnosis (Condition) matches the scenario's correct condition.
     */
    evaluateDiagnosis(scenario: ScenarioEntity, submittedCondition: ConditionEntity): { isCorrect: boolean; feedback: string } {
        const correctConditionId = scenario.correctDiagnosis?.id;
        const submittedConditionId = submittedCondition.id;

        const isCorrect = correctConditionId === submittedConditionId;

        // Centralized feedback logic
        const feedback = isCorrect 
            ? "Diagnosis matches the scenario's correct condition. Well done."
            : `Diagnosis incorrect. The patient is actually suffering from ${scenario.correctDiagnosis?.name || 'Unknown Condition'}.`;

        return { isCorrect, feedback };
    }
}