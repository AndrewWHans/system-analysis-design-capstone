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