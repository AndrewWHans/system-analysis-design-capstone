import { DiagnosisEntity } from "../entity/DiagnosisEntity";
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
     * Evaluates if a submitted diagnosis matches the scenario's correct diagnosis.
     */
    evaluateDiagnosis(scenario: ScenarioEntity, submittedDiagnosis: DiagnosisEntity): { isCorrect: boolean; feedback: string } {
        const correctConditionId = scenario.correctDiagnosis?.condition?.id;
        const submittedConditionId = submittedDiagnosis.condition?.id;

        const isCorrect = correctConditionId === submittedConditionId;

        // Centralized feedback logic
        const feedback = isCorrect 
            ? "Diagnosis matches the scenario's correct diagnosis. Well done."
            : `Diagnosis incorrect. The patient is actually suffering from ${scenario.correctDiagnosis?.condition?.name || 'Unknown Condition'}.`;

        return { isCorrect, feedback };
    }
}