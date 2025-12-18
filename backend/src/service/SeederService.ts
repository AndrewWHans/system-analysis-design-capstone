import { BaseRepository } from "../repository/BaseRepository";
import { TriggerEntity } from "../entity/TriggerEntity";
import { MoodEntity } from "../entity/MoodEntity";
import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { SymptomEntity } from "../entity/SymptomEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity, NodeType } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";
import { AppDataSource } from "../data-source";

/**
 * Helper class to build scenarios programmatically with a grid-based visual layout.
 * Layout dimensions can be customized per instance.
 */
class ScenarioBuilderHelper {
    private scenario: ScenarioEntity;
    private nodeRepo: BaseRepository<DialogueNodeEntity>;
    private choiceRepo: BaseRepository<TherapistChoiceEntity>;
    private colWidth: number;
    private rowHeight: number;

    constructor(
        scenario: ScenarioEntity,
        nodeRepo: BaseRepository<DialogueNodeEntity>,
        choiceRepo: BaseRepository<TherapistChoiceEntity>,
        colWidth: number = 2400, // Default width if not specified
        rowHeight: number = 500  // Default height if not specified
    ) {
        this.scenario = scenario;
        this.nodeRepo = nodeRepo;
        this.choiceRepo = choiceRepo;
        this.colWidth = colWidth;
        this.rowHeight = rowHeight;
    }

    /**
     * Creates a node at a specific Grid position.
     */
    async addNode(col: number, row: number, type: NodeType, text: string = "", metadata: any = null): Promise<DialogueNodeEntity> {
        return await this.nodeRepo.save(this.nodeRepo.create({
            scenario: this.scenario,
            type: type,
            botText: text,
            metadata: metadata,
            uiX: col * this.colWidth,
            uiY: row * this.rowHeight,
            isEndNode: type === NodeType.END
        }));
    }

    async addDialogue(col: number, row: number, text: string) {
        return this.addNode(col, row, NodeType.DIALOGUE, text);
    }

    async addObservation(col: number, row: number, text: string) {
        return this.addNode(col, row, NodeType.OBSERVATION, text);
    }

    async addStateUpdate(col: number, row: number, variable: string, operator: 'add' | 'sub' | 'set' | 'mult', value: number) {
        return this.addNode(col, row, NodeType.STATE_UPDATE, "", { variable, operator, value });
    }

    async addLogic(col: number, row: number, variable: string, operator: '>' | '<' | '==' | '!=' | '>=' | '<=', value: number) {
        return this.addNode(col, row, NodeType.LOGIC, "", { variable, operator, value });
    }

    async addRandom(col: number, row: number) {
        return this.addNode(col, row, NodeType.RANDOM, "", null);
    }

    async addEnd(col: number, row: number, text: string) {
        return this.addNode(col, row, NodeType.END, text);
    }

    /**
     * Connects two nodes. 
     * Note: For LOGIC nodes, the orderIndex determines the path (0=True, 1=False).
     */
    async connect(source: DialogueNodeEntity, target: DialogueNodeEntity, text: string, orderIndex: number = 0) {
        await this.choiceRepo.save(this.choiceRepo.create({
            sourceNode: source,
            nextNode: target,
            text: text,
            orderIndex: orderIndex
        }));
    }
}

export class SeederService {
    constructor(
        private triggerRepo: BaseRepository<TriggerEntity>,
        private moodRepo: BaseRepository<MoodEntity>,
        private copingRepo: BaseRepository<CopingMechanismEntity>,
        private symptomRepo: BaseRepository<SymptomEntity>,
        private conditionRepo: BaseRepository<ConditionEntity>,
        private scenarioRepo: BaseRepository<ScenarioEntity>,
        private nodeRepo: BaseRepository<DialogueNodeEntity>,
        private choiceRepo: BaseRepository<TherapistChoiceEntity>
    ) {}

    async seed() {
        const existingCount = await this.triggerRepo.repo.count();
        if (existingCount > 0) {
            console.log("Database already seeded. Skipping.");
            return;
        }

        console.log("Seeding clinical data...");
        const conditionMap = await this.seedClinicalData();

        console.log("Seeding Scenario 1: The Overwhelmed Architect...");
        const gad = conditionMap.get("Generalized Anxiety Disorder");
        if (!gad) {
            throw new Error("Condition 'Generalized Anxiety Disorder' not found in conditionMap");
        }
        await this.createAnxietyScenario(gad);

        console.log("Seeding Scenario 2: The Late-Night Coder...");
        const bipolar = conditionMap.get("Bipolar II Disorder");
        if (!bipolar) {
            throw new Error("Condition 'Bipolar II Disorder' not found in conditionMap");
        }
        await this.createBipolarScenario(bipolar);

        console.log("Seeding Scenario 3: The Silenced Singer...");
        const sad = conditionMap.get("Social Anxiety Disorder");
        if (!sad) {
            throw new Error("Condition 'Social Anxiety Disorder' not found in conditionMap");
        }
        await this.createSocialAnxietyScenario(sad);

        console.log("Seeding complete.");
    }

    /**
     * Call this manually if you need to wipe the DB during dev (be careful!)
     */
    async clearDatabase() {
        const entities = [
            "therapist_choices", "messages", "therapy_sessions", 
            "dialogue_nodes", "scenarios", "condition_symptoms", 
            "symptom_triggers", "symptom_moods", "symptom_coping_mechanisms",
            "conditions", "symptoms", "triggers", "moods", "coping_mechanisms"
        ];
        
        console.log("Clearing database...");
        try {
            await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0;");
            for (const entity of entities) {
                await AppDataSource.query(`TRUNCATE TABLE ${entity};`);
            }
            await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1;");
            console.log("Database cleared.");
        } catch (error) {
            console.error("Error clearing database:", error);
        }
    }

        private async seedClinicalData(): Promise<Map<string, ConditionEntity>> {
        const existingCount = await this.triggerRepo.repo.count();
        if (existingCount > 0) {
            console.log("Database already seeded with clinical data.");

            const existingConditions = await this.conditionRepo.repo.find();
            const existingConditionMap = new Map<string, ConditionEntity>();
            for (const cond of existingConditions) {
                existingConditionMap.set(cond.name, cond);
            }

            return existingConditionMap;
        }

        console.log("Seeding extensive clinical data...");

        // Triggers, moods, and coping mechanisms

        const triggers = [
            // Interpersonal
            "Social Conflict", "Rejection", "Criticism", "Family Expectations", 
            "Abandonment", "Being Ignored", "Crowded Spaces", "Public Speaking",
            // Environmental/Sensory
            "Loud Noises", "Bright Lights", "Sensory Overload", "Seasonal Changes",
            "Cluttered Environment", "Traffic/Commuting", "Confined Spaces",
            // Professional/Academic
            "Work Stress", "Deadlines", "Perceived Failure", "Academic Pressure",
            "Financial Strain", "Job Insecurity", "Performance Reviews", "Email Notifications",
            // Internal/Health
            "Sleep Deprivation", "Hormonal Fluctuations", "Chronic Pain", "Health Anxiety",
            "Hunger/Low Blood Sugar", "Caffeine Overload", "Substance Withdrawal",
            // Existential
            "Uncertainty", "Major Life Transition", "Loss of Loved One", "Traumatic Reminder"
        ];

        const moods = [
            // Negative Valence
            "Anxious", "Depressed", "Irritable", "Hopeless", "Angry", 
            "Guilty", "Ashamed", "Terrified", "Resentful", "Jealous",
            "Lonely", "Overwhelmed", "Despondent", "Suspicious",
            // Low Arousal
            "Numb", "Empty", "Apathetic", "Fatigued", "Bored", "Dissociated",
            // High Arousal
            "Restless", "Hyperactive", "Panic-stricken", "Agitated",
            // Positive/Manic
            "Euphoric", "Elated", "Grandioise", "Invincible"
        ];

        const coping = [
            // Adaptive (Healthy)
            "Deep Breathing", "Journaling", "Meditation", "Progressive Muscle Relaxation",
            "Exercise", "Cognitive Reframing", "Grounding 5-4-3-2-1", "Calling a Friend",
            "Art Therapy", "Sleep Hygiene", "Mindfulness", "Assertiveness Training",
            "Spending Time in Nature", "Listening to Music", "Reading",
            // Maladaptive (Unhealthy)
            "Avoidance", "Isolation", "Substance Use", "Self-Harm", 
            "Overeating", "Undereating", "Compulsive Shopping", "Excessive Sleeping",
            "Dissociation", "Nail Biting", "Skin Picking", "Procrastination",
            "Doomscrolling", "Excessive Reassurance Seeking", "Lashing Out"
        ];

        const triggerMap = new Map();
        const moodMap = new Map();
        const copingMap = new Map();

        // Save sequentially to avoid race conditions in SQLite/MySQL if using limited connections
        for (const t of triggers) triggerMap.set(t, await this.triggerRepo.save(this.triggerRepo.create({ name: t })));
        for (const m of moods) moodMap.set(m, await this.moodRepo.save(this.moodRepo.create({ name: m })));
        for (const c of coping) copingMap.set(c, await this.copingRepo.save(this.copingRepo.create({ name: c })));

        // Symptoms
        
        const getT = (names: string[]) => names.map(n => triggerMap.get(n)).filter(x => x);
        const getM = (names: string[]) => names.map(n => moodMap.get(n)).filter(x => x);
        const getC = (names: string[]) => names.map(n => copingMap.get(n)).filter(x => x);

        const symptomsData = [
            {
                name: "Impulsivity / Risk-taking", 
                severity: 7, 
                frequency: 3, 
                duration: 2, 
                lifeImpact: 8,
                triggers: ["Sleep Deprivation", "Major Life Transition", "Grandioise"], 
                moods: ["Euphoric", "Elated", "Agitated"],
                coping: ["Compulsive Shopping", "Substance Use", "Speeding/Reckless Driving"]
            },
            {
                name: "Reduced Need for Sleep",
                severity: 6,
                frequency: 2,
                duration: 3,
                lifeImpact: 5,
                triggers: ["Major Life Transition", "Seasonal Changes"],
                moods: ["Euphoric", "Restless", "Hyperactive"],
                coping: ["Procrastination", "Art Therapy", "Cleaning"]
            },
            {
                name: "Anhedonia", severity: 8, frequency: 5, duration: 4, lifeImpact: 9,
                triggers: ["Perceived Failure", "Loneliness", "Chronic Pain"],
                moods: ["Apathetic", "Numb", "Empty"],
                coping: ["Isolation", "Excessive Sleeping", "Substance Use"]
            },
            {
                name: "Psychomotor Agitation", severity: 7, frequency: 4, duration: 2, lifeImpact: 6,
                triggers: ["Anxious", "Work Stress", "Caffeine Overload"],
                moods: ["Restless", "Irritable", "Anxious"],
                coping: ["Exercise", "Nail Biting", "Pacing"]
            },
            {
                name: "Insomnia", severity: 7, frequency: 5, duration: 4, lifeImpact: 8,
                triggers: ["Work Stress", "Sleep Deprivation", "Financial Strain"],
                moods: ["Irritable", "Hopeless", "Restless"],
                coping: ["Meditation", "Sleep Hygiene", "Doomscrolling"]
            },
            {
                name: "Panic Attacks", severity: 9, frequency: 3, duration: 1, lifeImpact: 9,
                triggers: ["Social Conflict", "Public Speaking", "Crowded Spaces"],
                moods: ["Terrified", "Overwhelmed", "Panic-stricken"],
                coping: ["Deep Breathing", "Grounding 5-4-3-2-1", "Avoidance"]
            },
            {
                name: "Fatigue/Low Energy", severity: 6, frequency: 5, duration: 5, lifeImpact: 7,
                triggers: ["Work Stress", "Loneliness", "Seasonal Changes"],
                moods: ["Depressed", "Hopeless", "Apathetic", "Fatigued"],
                coping: ["Excessive Sleeping", "Isolation", "Caffeine Overload"]
            },
            {
                name: "Grandiosity", severity: 8, frequency: 4, duration: 4, lifeImpact: 8,
                triggers: ["Sleep Deprivation", "Major Life Transition"],
                moods: ["Euphoric", "Elated", "Grandioise", "Invincible"],
                coping: ["Substance Use", "Compulsive Shopping"]
            },
            {
                name: "Hypervigilance", severity: 8, frequency: 5, duration: 5, lifeImpact: 8,
                triggers: ["Traumatic Reminder", "Loud Noises", "Uncertainty"],
                moods: ["Terrified", "Suspicious", "Anxious"],
                coping: ["Avoidance", "Isolation", "Excessive Reassurance Seeking"]
            },
            {
                name: "Flashbacks", severity: 10, frequency: 3, duration: 2, lifeImpact: 9,
                triggers: ["Traumatic Reminder", "Sensory Overload"],
                moods: ["Terrified", "Numb", "Dissociation"],
                coping: ["Grounding 5-4-3-2-1", "Dissociation", "Substance Use"]
            },
            {
                name: "Obsessive Thoughts", severity: 7, frequency: 5, duration: 3, lifeImpact: 7,
                triggers: ["Uncertainty", "Health Anxiety", "Perceived Failure"],
                moods: ["Anxious", "Guilty"],
                coping: ["Avoidance", "Journaling", "Excessive Reassurance Seeking"]
            },
            {
                name: "Suicidal Ideation", severity: 10, frequency: 2, duration: 2, lifeImpact: 10,
                triggers: ["Loss of Loved One", "Hopeless", "Chronic Pain"],
                moods: ["Hopeless", "Despondent", "Empty"],
                coping: ["Calling a Friend", "Self-Harm", "Art Therapy"]
            },
            {
                name: "Muscle Tension", severity: 5, frequency: 5, duration: 4, lifeImpact: 4,
                triggers: ["Work Stress", "Deadlines", "Traffic/Commuting"],
                moods: ["Anxious", "Irritable"],
                coping: ["Progressive Muscle Relaxation", "Exercise", "Massage"]
            },
            {
                name: "Difficulty Concentrating", severity: 6, frequency: 4, duration: 3, lifeImpact: 7,
                triggers: ["Sleep Deprivation", "Sensory Overload", "Email Notifications"],
                moods: ["Overwhelmed", "Frustrated", "Anxious"],
                coping: ["Procrastination", "Mindfulness", "Doomscrolling"]
            },
            {
                name: "GI Disturbances", severity: 6, frequency: 3, duration: 2, lifeImpact: 6,
                triggers: ["Public Speaking", "Performance Reviews", "Anxious"],
                moods: ["Anxious", "Nauseous", "Terrified"],
                coping: ["Avoidance", "Deep Breathing"]
            }
        ];

        const symptomMap = new Map();
        for (const s of symptomsData) {
            const ent = await this.symptomRepo.save(this.symptomRepo.create({
                name: s.name,
                severity: s.severity,
                frequency: s.frequency,
                duration: s.duration,
                lifeImpact: s.lifeImpact,
                triggers: getT(s.triggers),
                moods: getM(s.moods),
                copingMechanisms: getC(s.coping)
            }));
            symptomMap.set(s.name, ent);
        }

        const getS = (names: string[]) => names.map(n => symptomMap.get(n)).filter(x => x);

        // Conditions

        const conditionsData = [
            { name: "Major Depressive Disorder", symptoms: ["Anhedonia", "Fatigue/Low Energy", "Insomnia", "Suicidal Ideation", "Difficulty Concentrating"] },
            { name: "Generalized Anxiety Disorder", symptoms: ["Panic Attacks", "Insomnia", "Psychomotor Agitation", "Muscle Tension", "GI Disturbances", "Obsessive Thoughts"] },
            { name: "Post-Traumatic Stress Disorder", symptoms: ["Hypervigilance", "Flashbacks", "Anhedonia", "Insomnia", "Avoidance"] },
            { name: "Bipolar I Disorder", symptoms: ["Grandiosity", "Fatigue/Low Energy", "Psychomotor Agitation", "Risk-taking"] },
            { name: "Bipolar II Disorder", symptoms: ["Anhedonia", "Fatigue/Low Energy", "Grandiosity", "Reduced Need for Sleep", "Impulsivity / Risk-taking", "Difficulty Concentrating"] },
            { name: "Obsessive-Compulsive Disorder", symptoms: ["Obsessive Thoughts", "Hypervigilance"] },
            { name: "Social Anxiety Disorder", symptoms: ["Panic Attacks", "Isolation", "GI Disturbances"] },
            { name: "Borderline Personality Disorder", symptoms: ["Suicidal Ideation", "Angry", "Emotional Dysregulation"] },
            { name: "Adjustment Disorder with Anxiety", symptoms: ["Insomnia", "Muscle Tension", "Difficulty Concentrating"] },
            { name: "ADHD (Inattentive Type)", symptoms: ["Difficulty Concentrating", "Procrastination", "Restless"] }
        ];

        const conditionMap = new Map();
        for (const c of conditionsData) {
            const ent = await this.conditionRepo.save(this.conditionRepo.create({
                name: c.name,
                symptoms: getS(c.symptoms)
            }));
            conditionMap.set(c.name, ent);
        }

        console.log("Clinical data seeding complete.");

        return conditionMap;
    }

    private async createAnxietyScenario(correctDiagnosis: ConditionEntity) {
        // Create Scenario Container
        const scenario = await this.scenarioRepo.save(
            this.scenarioRepo.create({
                name: "Case Study: The Overwhelmed Architect",
                description:
                    "Alex (27) is a junior architect who recently received a major promotion. Reports feeling 'on edge' constantly, trouble sleeping, and excessive worry about minor details.",
                correctDiagnosis: correctDiagnosis,
                initialState: {
                    anxiety_score: 0,
                    rapport: 50,
                    catastrophizing: 0,
                    trauma_focus: 0,
                    depression_focus: 0,
                    attention_focus: 0
                }
            })
        );

        // Use standard wide layout for this scenario
        const builder = new ScenarioBuilderHelper(scenario, this.nodeRepo, this.choiceRepo, 2400, 500);

        // --- ROOT (Col 0) ---
        const root = await builder.addNode(
            0,
            3,
            NodeType.ROOT,
            "Hey. Thanks for squeezing me in. I only have like half an hour before a project meeting, but I feel like I’m constantly one mistake away from everything collapsing."
        );
        scenario.rootDialogueNode = root;
        await this.scenarioRepo.save(scenario);

        // --- PHASE 1: FIRST THERAPIST MOVE (Col 1) ---

        // 1A – Empathic, open-ended
        const suWarmRapport = await builder.addStateUpdate(0.5, 2, "rapport", "add", 15);
        const suWarmAnxiety = await builder.addStateUpdate(0.75, 2, "anxiety_score", "add", 5);

        const nWarmOpen = await builder.addDialogue(
            1.5,
            2,
            "It’s like my brain is running disaster simulations all day. Even when things are fine on paper, I’m imagining worst-case scenarios."
        );

        await builder.connect(
            root,
            suWarmRapport,
            "It sounds really intense to live with that constant sense of ‘one mistake away.’ Can you walk me through a recent day where this felt especially strong?"
        );
        await builder.connect(suWarmRapport, suWarmAnxiety, "");
        await builder.connect(suWarmAnxiety, nWarmOpen, "");

        // 1B – Symptom checklist / medicalized
        const suChecklistRapport = await builder.addStateUpdate(0.5, 1, "rapport", "sub", 5);
        const suChecklistAnxiety = await builder.addStateUpdate(0.75, 1, "anxiety_score", "add", 3);

        const nChecklistIntro = await builder.addDialogue(
            1.5,
            1,
            "Um, okay. I guess… I don’t know what box I fit in. I’m tired, I’m jittery, I can’t shut my brain off. Does that help?"
        );

        await builder.connect(
            root,
            suChecklistRapport,
            "To make sure I understand quickly, I’m going to ask you a few specific symptom questions, sleep, appetite, energy, and focus. Does that sound alright?"
        );
        await builder.connect(suChecklistRapport, suChecklistAnxiety, "");
        await builder.connect(suChecklistAnxiety, nChecklistIntro, "");

        // 1C – Stress/burnout framing
        const suStressRapport = await builder.addStateUpdate(0.5, 3, "rapport", "add", 5);
        const suStressDepression = await builder.addStateUpdate(0.75, 3, "depression_focus", "add", 5);

        const nStressIntro = await builder.addDialogue(
            1.5,
            3,
            "Everyone keeps saying, ‘Congrats on the promotion!’ and I smile and say thanks, but inside I’m thinking, ‘You have no idea how close I am to dropping the ball.’ It feels like pure burnout."
        );

        await builder.connect(
            root,
            suStressRapport,
            "A promotion plus a big meeting soon, that’s a lot to juggle. I’m curious: in your mind, is this mostly about work stress and burnout, or something different?"
        );
        await builder.connect(suStressRapport, suStressDepression, "");
        await builder.connect(suStressDepression, nStressIntro, "");

        // 1D – Rushed, meds-first framing
        const suMedsRapport = await builder.addStateUpdate(0.5, 4, "rapport", "sub", 15);
        const suMedsAnxiety = await builder.addStateUpdate(0.75, 4, "anxiety_score", "add", 2);

        const nMedFirstIntro = await builder.addDialogue(
            1.5,
            4,
            "If there’s a pill that makes me stop overthinking everything, I’ll take ten. I don’t know if this is ‘anxiety’ or whatever, I just know I can’t keep going like this."
        );

        await builder.connect(
            root,
            suMedsRapport,
            "Since we don’t have much time, I’d like to get a quick sense of symptoms and talk about whether medication might help. Does that sound like what you’re looking for today?"
        );
        await builder.connect(suMedsRapport, suMedsAnxiety, "");
        await builder.connect(suMedsAnxiety, nMedFirstIntro, "");

        // --- PHASE 2A: WARM-OPEN BRANCH (Col 2) ---

        const nWarmOpen_Somatic = await builder.addDialogue(
            2.5,
            1,
            "By lunch my shoulders are up near my ears. My stomach is in knots, and sometimes my heart races when I’m literally just sitting at my desk."
        );
        const nWarmOpen_Cognitive = await builder.addDialogue(
            2.5,
            2,
            "My brain runs through everything that could go wrong: missed details, angry clients, a tiny mistake that ruins a whole project. Even at home I’m mentally editing drawings."
        );
        const nWarmOpen_History = await builder.addDialogue(
            2.5,
            3,
            "I’ve always been like this, honestly. Nervous kid, perfectionist student. The promotion just turned the volume way up."
        );

        await builder.connect(
            nWarmOpen,
            nWarmOpen_Somatic,
            "When you’re in that disaster-simulation mode, what do you notice in your body, heart, breathing, tension?"
        );
        await builder.connect(
            nWarmOpen,
            nWarmOpen_Cognitive,
            "I’d like to hear more about those ‘disaster simulations’ what kinds of thoughts show up most often?"
        );
        await builder.connect(
            nWarmOpen,
            nWarmOpen_History,
            "Has your mind always worked like this, or does this feel totally new since the promotion?"
        );

        // Somatic branch from warm
        const suSomaticAnxiety = await builder.addStateUpdate(3.5, 1, "anxiety_score", "add", 5);
        const suSomaticCatastrophizing = await builder.addStateUpdate(3.75, 1, "catastrophizing", "add", 5);

        const nWarmSomaticDetail = await builder.addDialogue(
            4.5,
            1,
            "Sometimes I have to step into the stairwell because I’m convinced I’m about to pass out. Then my smartwatch tells me my heart rate is through the roof, which makes me panic more."
        );

        await builder.connect(
            nWarmOpen_Somatic,
            suSomaticAnxiety,
            "Those physical sensations sound really intense. Have they ever built up into moments that feel like panic attacks?"
        );
        await builder.connect(suSomaticAnxiety, suSomaticCatastrophizing, "");
        await builder.connect(suSomaticCatastrophizing, nWarmSomaticDetail, "");

        // Cognitive branch from warm
        const suCognitiveAnxiety = await builder.addStateUpdate(3.5, 2, "anxiety_score", "add", 8);
        const suCognitiveCatastrophizing = await builder.addStateUpdate(3.75, 2, "catastrophizing", "add", 8);

        const nWarmCognitiveDetail = await builder.addDialogue(
            4.5,
            2,
            "It’s not just work. I’ll be making dinner and think, ‘What if I gave someone food poisoning?’ Or texting a friend and think, ‘What if they secretly hate me now?’ It’s ridiculous, but it feels real."
        );

        await builder.connect(
            nWarmOpen_Cognitive,
            suCognitiveAnxiety,
            "It sounds like your mind is constantly scanning for what might go wrong, in work and beyond. Does that show up in other parts of your life too?"
        );
        await builder.connect(suCognitiveAnxiety, suCognitiveCatastrophizing, "");
        await builder.connect(suCognitiveCatastrophizing, nWarmCognitiveDetail, "");

        // History branch from warm
        const suHistoryAnxiety = await builder.addStateUpdate(3.5, 3, "anxiety_score", "add", 4);
        const suHistoryRapport = await builder.addStateUpdate(3.75, 3, "rapport", "add", 5);

        const nWarmHistoryDetail = await builder.addDialogue(
            4.5,
            3,
            "In school I would triple-check assignments, reread emails ten times… People called me ‘thorough.’ Now it’s like the same habits on steroids."
        );

        await builder.connect(
            nWarmOpen_History,
            suHistoryAnxiety,
            "That sounds like a long-standing pattern of worry and checking. How has that changed since the promotion?"
        );
        await builder.connect(suHistoryAnxiety, suHistoryRapport, "");
        await builder.connect(suHistoryRapport, nWarmHistoryDetail, "");

        // Choices from nWarmSomaticDetail
        const nWarmSomatic_Broaden = await builder.addEnd(
            5.5,
            0.5,
            "It’s not just my body freaking out. I lie in bed thinking through every little thing that could go wrong the next day."
        );
        const nWarmSomatic_Medical = await builder.addDialogue(
            5.5,
            1.5,
            "I’ve done the blood tests and ECGs. Doctors keep saying ‘stress.’ I get that, but it feels like something is fundamentally wrong with me."
        );
        const nWarmSomatic_Minimize = await builder.addDialogue(
            5.5,
            2.5,
            "I don’t know, maybe I’m overreacting. Everyone is stressed. I just happen to freak out in stairwells, I guess."
        );

        await builder.connect(
            nWarmSomaticDetail,
            nWarmSomatic_Broaden,
            "Beyond those intense physical episodes, how much does worry follow you into the rest of your day, thoughts at night, decisions, relationships?"
        );
        await builder.connect(
            nWarmSomaticDetail,
            nWarmSomatic_Medical,
            "Have doctors ruled out medical causes for these episodes, or is that still an open question for you?"
        );
        await builder.connect(
            nWarmSomaticDetail,
            nWarmSomatic_Minimize,
            "Part of you sounds unsure if this is ‘bad enough’ to count as a problem. Can you say more about that?"
        );

        // --- PHASE 2B: CHECKLIST BRANCH (Col 2) ---

        const nChecklist_Sleep = await builder.addDialogue(
            2.5,
            0,
            "Sleep is a joke. I either can’t fall asleep because I’m replaying my day, or I wake up at 3am thinking about a tiny detail on a drawing."
        );
        const nChecklist_Mood = await builder.addDialogue(
            2.5,
            1,
            "I wouldn’t say I’m ‘sad’ exactly. More… wired and exhausted. People keep asking if I’m okay and I just laugh it off."
        );
        const nChecklist_Focus = await builder.addDialogue(
            2.5,
            2,
            "My focus is all over the place, but it’s not like random distractions. It’s my own brain hijacking me with ‘what if you missed something’ thoughts."
        );

        await builder.connect(
            nChecklistIntro,
            nChecklist_Sleep,
            "Let’s start with sleep. How has your sleep been over the past few months?"
        );
        await builder.connect(
            nChecklistIntro,
            nChecklist_Mood,
            "What about your mood overall? Feeling low, flat, hopeless, or tearful?"
        );
        await builder.connect(
            nChecklistIntro,
            nChecklist_Focus,
            "How is your concentration? Any trouble staying on task, organizing, or following through?"
        );

        // From checklist-sleep
        const suChecklistSleepAnxiety = await builder.addStateUpdate(3.5, 0, "anxiety_score", "add", 4);
        const nChecklistSleepMore = await builder.addDialogue(
            4.5,
            0,
            "I try all the sleep-hygiene hacks on TikTok. Then I feel guilty for not doing them perfectly and end up scrolling instead of resting."
        );

        await builder.connect(
            nChecklist_Sleep,
            suChecklistSleepAnxiety,
            "It sounds like worry is really active at night. What tends to run through your mind when you can’t sleep?"
        );
        await builder.connect(suChecklistSleepAnxiety, nChecklistSleepMore, "");

        // From checklist-mood (depression-focus vs anxiety-focus)
        const suChecklistMoodDep = await builder.addStateUpdate(3.5, 1, "depression_focus", "add", 10);
        const suChecklistMoodAnx = await builder.addStateUpdate(3.75, 1, "anxiety_score", "add", 3);

        const nChecklistMoodDepPath = await builder.addDialogue(
            4.5,
            1,
            "I cancel plans a lot because I’m so drained. People probably think I’m depressed. I still care about things, though I just feel too tense to enjoy them."
        );

        await builder.connect(
            nChecklist_Mood,
            suChecklistMoodDep,
            "The exhaustion and canceled plans you mention can be part of depression. Do you feel like you’ve lost interest or pleasure in things you used to enjoy?"
        );
        await builder.connect(suChecklistMoodDep, suChecklistMoodAnx, "");
        await builder.connect(suChecklistMoodAnx, nChecklistMoodDepPath, "");

        // From checklist-focus (ADHD vs anxiety framing)
        const suChecklistFocusADHD = await builder.addStateUpdate(3.5, 2, "attention_focus", "add", 10);
        const suChecklistFocusAnx = await builder.addStateUpdate(3.75, 2, "anxiety_score", "add", 4);

        const nChecklistFocusADHDPath = await builder.addDialogue(
            4.5,
            2,
            "I’ve wondered about ADHD, but when I’m not anxious I can hyper-focus for hours. It’s like anxiety is the thing that scatters me."
        );

        await builder.connect(
            nChecklist_Focus,
            suChecklistFocusADHD,
            "A lot of adults with ADHD feel overwhelmed at work promotions. Does it feel like you’ve always struggled with attention and organization, even as a kid?"
        );
        await builder.connect(suChecklistFocusADHD, suChecklistFocusAnx, "");
        await builder.connect(suChecklistFocusAnx, nChecklistFocusADHDPath, "");

        // --- PHASE 2C: STRESS/BURNOUT BRANCH (Col 2) ---

        const nStress_Future = await builder.addDialogue(
            2.5,
            3,
            "Part of me thinks, ‘This is just what being successful feels like-constant pressure.’ Another part of me wonders if I’m actually falling apart."
        );
        const nStress_Hopeless = await builder.addEnd(
            2.5,
            4,
            "Sometimes I think, ‘If I just quit and moved somewhere no one knows me, maybe I could finally breathe.’ I don’t *want* to die, I just want everything to stop for a while."
        );
        const nStress_Coping = await builder.addDialogue(
            2.5,
            5,
            "I drink more than I used to. And I ‘accidentally’ forget to open email on weekends. Avoidance is kind of my hobby."
        );

        await builder.connect(
            nStressIntro,
            nStress_Future,
            "When you imagine staying in this role for the next year or two, what goes through your mind?"
        );
        await builder.connect(
            nStressIntro,
            nStress_Hopeless,
            "You mentioned feeling close to dropping the ball. Do thoughts ever drift toward not wanting to be here or wishing you could disappear?"
        );
        await builder.connect(
            nStressIntro,
            nStress_Coping,
            "How have you been coping with this pressure-things you do to get through the day or take the edge off?"
        );

        // --- PHASE 2D: MEDS-FIRST BRANCH (Col 2) ---

        const nMeds_Explore = await builder.addEnd(
            2.5,
            6,
            "If meds can quiet my brain, I’m open. I just don’t want to become a zombie. I still want to care, just… less catastrophizing."
        );
        const nMeds_QuickLabel = await builder.addDialogue(
            2.5,
            7,
            "If we’re just slapping a label on this so I can get a prescription, call it whatever you want. ‘Anxious mess’ works."
        );

        await builder.connect(
            nMedFirstIntro,
            nMeds_Explore,
            "Medication can sometimes help turn the volume down on anxiety. Before we talk specifics, I want to understand what ‘quieting your brain’ would look like for you."
        );
        await builder.connect(
            nMedFirstIntro,
            nMeds_QuickLabel,
            "Based on what you’ve said, it may fit under an anxiety or depressive label. We can sort that out as we go and focus on a prescription."
        );

        // --- LOGIC NODE: RAPPORT GATE (Col 5) ---
        // This is one of the few convergence points: if rapport is high, Alex discloses more panic-like detail.
        const logicRapportHigh = await builder.addLogic(5, 2.5, "rapport", ">", 55);

        const nDisclosePanic = await builder.addDialogue(
            6,
            2,
            "There was a day last month when I had to lock myself in a bathroom stall because I was sure I was going to pass out. My hands were shaking so much I could barely text my partner."
        );
        const nKeepSurface = await builder.addDialogue(
            6,
            3,
            "I mean, it’s bad, but I’m fine. I’ve always handled things. I just… drink more coffee and triple-check everything."
        );

        // A few different branches feed into the rapport logic:
        await builder.connect(
            nWarmCognitiveDetail,
            logicRapportHigh,
            "Hearing how wide-ranging those worries are, I’m curious: have there been moments when it tipped into feeling like panic or losing control?"
        );
        await builder.connect(
            nChecklistSleepMore,
            logicRapportHigh,
            "Those restless nights sound really hard. Have your days ever built to a point where you felt like you were actually panicking?"
        );
        await builder.connect(
            nStress_Future,
            logicRapportHigh,
            "It sounds like you’re constantly bracing for impact. Has that ever boiled over into feeling like you’re about to lose it physically or emotionally?"
        );

        await builder.connect(logicRapportHigh, nDisclosePanic, "High rapport – Alex opens up about panic", 0);
        await builder.connect(logicRapportHigh, nKeepSurface, "Lower rapport – Alex stays surface-level", 1);

        // --- DIVERGENT LATE BRANCHES & ENDINGS (Col 7+) ---

        // 1) GAD-CONSISTENT PATH (GOOD DATA, CORRECT)
        const nGlobalWorry = await builder.addDialogue(
            7,
            2,
            "It’s not just work. I overthink texts, grocery lists, everything. My brain is always scanning for what could go wrong."
        );

        await builder.connect(
            nDisclosePanic,
            nGlobalWorry,
            "Between those intense episodes and the constant scanning you described earlier, it sounds like worry shows up across a lot of areas of life, not just the promotion. Is that right?"
        );

        const nRuleOutsGAD = await builder.addDialogue(
            8,
            2,
            "I don’t get flashbacks or anything like that. And when I’m not anxious, I can focus fine. I still enjoy things-I’m just too wound up to relax into them."
        );

        await builder.connect(
            nGlobalWorry,
            nRuleOutsGAD,
            "To help me understand, I want to check a few things: do you get vivid flashbacks to past events, feel persistently hopeless, or struggle with focus even when you’re not anxious?"
        );

        const endGAD = await builder.addEnd(
            9,
            2,
            "So you’re saying my brain’s alarm system is basically stuck on high. If we can dial the volume down on the constant worrying, I might actually be able to enjoy this promotion."
        );

        await builder.connect(
            nRuleOutsGAD,
            endGAD,
            "From what you’ve shared-longstanding, excessive worry across many areas, physical tension, sleep trouble, but no persistent hopelessness or flashbacks-this fits well with an anxiety pattern we call Generalized Anxiety Disorder."
        );

        // 2) MDD-LEANING MISDIAGNOSIS PATH (DEPRESSION)
        const nDepFramed = await builder.addDialogue(
            7,
            0,
            "So… we’re calling this depression? I mean, I am tired and I bail on plans, but it feels more like my mind won’t stop than like I don’t care."
        );

        await builder.connect(
            nChecklistMoodDepPath,
            nDepFramed,
            "Given the exhaustion, canceled plans, and how drained you feel, this could fit with a depressive picture. We might be looking at Major Depressive Disorder."
        );

        const endMDD = await builder.addEnd(
            8,
            0,
            "If this is ‘depression,’ I guess I’ll try whatever you recommend. I just hope it quiets my brain, not just knocks me out."
        );

        await builder.connect(
            nDepFramed,
            endMDD,
            "We can move forward with a working diagnosis of Major Depressive Disorder and explore treatments aimed at your mood and energy."
        );

        // 3) PTSD-LEANING MISDIAGNOSIS PATH (TRAUMA FOCUS)
        const suTraumaFocus = await builder.addStateUpdate(6, 1, "trauma_focus", "add", 10);
        const nTraumaStory = await builder.addDialogue(
            7,
            1,
            "There was a bad car accident a few years back. Loud crashes still make me jump, but what really keeps me up is obsessing about messing up at work."
        );

        await builder.connect(
            nWarmHistoryDetail,
            suTraumaFocus,
            "Sometimes long-standing worry can be made worse by scary experiences like accidents or losses. Has anything like that happened to you?"
        );
        await builder.connect(suTraumaFocus, nTraumaStory, "");

        const nPTSDLabel = await builder.addDialogue(
            8,
            1,
            "So this might all be about that car accident? I hadn’t really connected it to work anxiety, but I guess it could be related."
        );

        await builder.connect(
            nTraumaStory,
            nPTSDLabel,
            "Given that accident and your current jumpiness, some of this may fit with a post-traumatic stress pattern."
        );

        const endPTSD = await builder.addEnd(
            9,
            1,
            "If this is mostly about the accident, I guess working on that might help. It still feels like my brain just won’t stop worrying about work, though."
        );

        await builder.connect(
            nPTSDLabel,
            endPTSD,
            "We can use a working diagnosis of Post-Traumatic Stress Disorder and focus treatment on processing that event and its impact on your current anxiety."
        );

        // 4) ADHD-LEANING MISDIAGNOSIS PATH
        const nADHDLabel = await builder.addDialogue(
            7,
            4,
            "ADHD… huh. I always thought I just wasn’t disciplined enough. I guess that would explain why I feel so scattered at work."
        );

        await builder.connect(
            nChecklistFocusADHDPath,
            nADHDLabel,
            "Given your difficulties with focus and organization, especially under pressure, this could be consistent with an ADHD picture."
        );

        const endADHD = await builder.addEnd(
            8,
            4,
            "If we’re going with ADHD, I just hope I don’t get labeled as ‘lazy.’ I’m trying so hard-all while my brain is sprinting."
        );

        await builder.connect(
            nADHDLabel,
            endADHD,
            "We can proceed with a working diagnosis of ADHD and explore strategies and possibly medications aimed at attention and executive function."
        );

        // 5) ADJUSTMENT / BURNOUT MISDIAGNOSIS PATH
        const nAdjustmentLabel = await builder.addDialogue(
            7,
            5,
            "So you think this is just me adjusting badly to a promotion? Part of me hopes you’re right. Part of me worries this is just how my brain is wired."
        );

        await builder.connect(
            nStress_Coping,
            nAdjustmentLabel,
            "Given the clear link to your recent promotion and how you’ve been coping, this might be an adjustment reaction or burnout related to increased demands."
        );

        const endAdjustment = await builder.addEnd(
            8,
            5,
            "If this is just ‘adjustment,’ maybe it’ll get better when work calms down… if it ever does."
        );

        await builder.connect(
            nAdjustmentLabel,
            endAdjustment,
            "We can treat this as an Adjustment Disorder or burnout and focus on stress management around this specific life transition."
        );

        // 6) MEDS-FOCUSED / THIN ASSESSMENT PATH
        const nQuickMedsPlan = await builder.addDialogue(
            7,
            6,
            "So we don’t really know what to call it, but we’re trying meds. I guess if it quiets my brain, I don’t care what the label is."
        );

        await builder.connect(
            nMeds_QuickLabel,
            nQuickMedsPlan,
            "Given your limited time and current distress, we can start with a medication that broadly targets anxiety and low mood, and refine the diagnosis later."
        );

        const endThinAssessment = await builder.addEnd(
            8,
            6,
            "I’ll try the medication. Maybe later we can figure out what’s actually going on, if I can keep up with appointments."
        );

        await builder.connect(
            nQuickMedsPlan,
            endThinAssessment,
            "We’ll move forward with a general ‘anxiety/depression’ label for now and see how you respond to medication."
        );

        // 7) DISENGAGEMENT / DROPOUT PATH (LOW RAPPORT)
        const nSkeptical = await builder.addDialogue(
            7,
            7,
            "This feels a bit rushed. I’m not sure therapy is for me if we’re just checking boxes and naming disorders."
        );

        await builder.connect(
            nKeepSurface,
            nSkeptical,
            "I know we don’t have unlimited time, and some of my questions are a bit structured. How is this conversation landing for you so far?"
        );

        const endDropout = await builder.addEnd(
            8,
            7,
            "I think I’ll just try to push through this on my own for now. Maybe I’ll come back if it gets worse."
        );

        await builder.connect(
            nSkeptical,
            endDropout,
            "If it doesn’t feel like a good fit right now, we can pause here. You’re always welcome to reach out again if you want to explore this more deeply."
        );

        // 8) SOMATIC-ONLY / “JUST ANXIOUS BUT UNLABELED” PATH
        const endSomaticOnly = await builder.addEnd(
            9,
            3.5,
            "So we’re calling it ‘stress’ and ‘tension.’ I guess that fits, even if it feels bigger than that inside my head."
        );

        await builder.connect(
            nWarmSomatic_Medical,
            endSomaticOnly,
            "Since your medical workup has been clear, we can frame this as stress and tension-related symptoms and focus mainly on physical coping skills for now."
        );

        // 9) MINIMIZING / INTERNALIZED STIGMA PATH
        const endMinimize = await builder.addEnd(
            9,
            4.5,
            "Other people probably have it worse. Maybe I’m just dramatic. I’ll try to ‘handle it’ and see how far I get."
        );

        await builder.connect(
            nWarmSomatic_Minimize,
            endMinimize,
            "If part of you feels unsure this is ‘serious enough,’ we can respect that and keep the focus light-simple stress-management tools and checking in if things worsen."
        );
    }

    private async createSocialAnxietyScenario(correctDiagnosis: ConditionEntity) {
        // 1. Create Scenario Container
        const scenario = await this.scenarioRepo.save(
            this.scenarioRepo.create({
                name: "Case Study: The Silenced Singer",
                description:
                    "Leo (24) is a semi-professional musician who recently walked off stage mid-set. He describes intense physical symptoms (heart racing, shaking) and is considering quitting music. He reports using alcohol to 'numb the nerves.'",
                correctDiagnosis: correctDiagnosis,
                initialState: {
                    rapport: 50,
                    social_score: 0,      // Tracks evidence for Social Anxiety
                    panic_score: 0,       // Tracks evidence for Panic Disorder
                    substance_score: 0    // Tracks evidence for Substance Use
                }
            })
        );

        // 2. Initialize Builder (Standard Layout)
        const builder = new ScenarioBuilderHelper(scenario, this.nodeRepo, this.choiceRepo, 2400, 500);

        // --- ROOT (Col 0) ---
        const root = await builder.addNode(
            0,
            3,
            NodeType.ROOT,
            "I don't even know why I'm here. I’m a musician, getting nervous is part of the job. But last Friday... I just froze. I looked at the crowd, my throat closed up, and I ran off stage. My band is furious."
        );
        scenario.rootDialogueNode = root;
        await this.scenarioRepo.save(scenario);

        // --- PHASE 1: FIRST PIVOT (Col 1) ---

        // Path A: Physical Focus (Leads toward Panic/Medical)
        const suPanicStart = await builder.addStateUpdate(0.5, 1, "panic_score", "add", 10);
        const nPhysical = await builder.addDialogue(
            1.5,
            1,
            "It felt like a heart attack. My chest got tight, my hands went numb. I genuinely thought I was going to die right there next to the drum kit."
        );

        await builder.connect(root, suPanicStart, "That sounds terrifying. Can you describe exactly what was happening in your body when you froze?");
        await builder.connect(suPanicStart, nPhysical, "");

        // Path B: Cognitive/Social Focus (Leads toward Social Anxiety)
        const suSocialStart = await builder.addStateUpdate(0.5, 3, "social_score", "add", 10);
        const nCognitive = await builder.addDialogue(
            1.5,
            3,
            "I saw this one guy in the front row whisper to his girlfriend, and my brain just screamed: 'They know you’re a fraud.' I felt like everyone was analyzing my every movement."
        );

        await builder.connect(root, suSocialStart, "What was going through your mind the moment you decided to leave the stage?");
        await builder.connect(suSocialStart, nCognitive, "");

        // Path C: Coping/Substance Focus (Leads toward Substance/Avoidance)
        const suSubstanceStart = await builder.addStateUpdate(0.5, 5, "substance_score", "add", 10);
        const nCoping = await builder.addDialogue(
            1.5,
            5,
            "Usually I have two or three shots of whiskey before a set and I’m fine. Friday I only had one. I guess I didn't numb myself enough."
        );

        await builder.connect(root, suSubstanceStart, "You mentioned getting nervous is part of the job. How have you been managing those nerves until now?");
        await builder.connect(suSubstanceStart, nCoping, "");

        // --- PHASE 2: DIVERGENT PATHS (Col 2 & 3) ---
        // Note: These branches deliberately do not cross back over easily.

        // --- BRANCH A: The "Heart Attack" (Panic vs Social) ---
        
        // A1: Context Check (Crucial for differential)
        const nContextCheck = await builder.addDialogue(
            3, 1,
            "No. Never at home. I mean, I worry at home, but I don't get the 'heart attack' feeling unless there are people around, or if I have to go to the grocery store during rush hour."
        );
        // A2: Medical focus (Distraction)
        const nMedicalFocus = await builder.addDialogue(
            3, 0,
            "I went to the ER afterwards. They did an ECG and said my heart is fine. They gave me a Xanax and told me to rest. But I can't 'rest' my way out of a career."
        );

        await builder.connect(nPhysical, nContextCheck, "Do these intense physical sensations ever happen when you are alone, or completely out of the blue?");
        await builder.connect(nPhysical, nMedicalFocus, "Did you seek any medical attention after the show to rule out heart issues?");

        // --- BRANCH B: The "Fraud" (Specific vs Generalized) ---

        // B1: Generalization (Key for SAD diagnosis)
        const nGeneralSocial = await builder.addDialogue(
            3, 3,
            "It’s not just performing. Ordering coffee is a nightmare. I rehearse what I'm going to say to the barista three times. If I stutter, I dwell on it for hours."
        );
        // B2: Performance Focus (Leads to "Specific Phobia" trap)
        const nPerformanceFocus = await builder.addDialogue(
            3, 4,
            "My music is personal. If they reject the song, they reject me. It feels like being naked on stage. I don't care about other stuff, but music is... everything."
        );

        await builder.connect(nCognitive, nGeneralSocial, "Does this fear of being analyzed or judged show up in other areas of your life, like parties or errands?");
        await builder.connect(nCognitive, nPerformanceFocus, "Is it specifically the music and the performance that feels dangerous, or being seen in general?");

        // --- BRANCH C: The "Whiskey" (Substance vs Symptom) ---

        // C1: Functional impairment (Dependency check)
        const nSubstanceDependence = await builder.addDialogue(
            3, 5,
            "I don't drink in the mornings or anything. But I literally cannot walk into a room full of strangers without a buzz. It's the only way the noise in my head stops."
        );
        // C2: Minimizing (Denial)
        const nMinimizing = await builder.addDialogue(
            3, 6,
            "Look, every musician drinks. It's the lifestyle. I'm not an alcoholic. I just had a bad night. Can't you just teach me some breathing exercises?"
        );

        await builder.connect(nCoping, nSubstanceDependence, "Does it feel like you can function socially without alcohol, or has it become a requirement?");
        await builder.connect(nCoping, nMinimizing, "I hear you saying it helps. Are you worried that the alcohol use itself is becoming the problem?");

        // --- PHASE 3: THE DIAGNOSTIC TRAPS (Col 4 & 5) ---

        // From nContextCheck (He admitted it happens at grocery stores too -> SAD Clue)
        const nSocialRealization = await builder.addDialogue(
            5, 1,
            "Exactly. It's the eyes. It feels like everyone is staring. Even at the grocery store, if I drop a coin, I feel like I have to leave immediately."
        );
        
        await builder.connect(nContextCheck, nSocialRealization, "You mentioned the grocery store. What is it about that environment that triggers the feeling?");
        await builder.connect(nContextCheck, nMedicalFocus, "Maybe we should focus on the physical symptoms. Have you considered beta-blockers?"); // Bad choice leads to medical node

        // From nMedicalFocus (Patient is frustrated)
        const nFrustrated = await builder.addDialogue(
            5, 0,
            "I don't want pills that make me sleepy. I need to be sharp to play. I just want to stop feeling like I'm dying every time I step out the door."
        );
        await builder.connect(nMedicalFocus, nFrustrated, "Since the doctors cleared you, we can treat this as Panic Disorder and work on breathing."); // Trap: Panic Disorder

        // From nGeneralSocial (Strong SAD Evidence)
        const nHistory = await builder.addDialogue(
            5, 3,
            "Since middle school. I used to eat lunch in the bathroom stall so no one would look at me. I thought becoming a rock star would 'fix' me, make me confident. It didn't."
        );
        await builder.connect(nGeneralSocial, nHistory, "It sounds like this fear of judgment has been with you for a long time. How far back does this go?");
        await builder.connect(nGeneralSocial, nFrustrated, "It sounds like you overthink things. Have you tried just ignoring those thoughts?"); // Invalidating choice

        // From nSubstanceDependence (Substance as coping mechanism)
        const nRootCause = await builder.addDialogue(
            5, 5,
            "The noise in my head is just... 'You look stupid,' 'Walk normal,' 'Don't spill that.' The alcohol turns that voice down from a 10 to a 4."
        );
        await builder.connect(nSubstanceDependence, nRootCause, "When you say 'noise in your head,' what is that voice telling you when you're sober?");
        await builder.connect(nSubstanceDependence, nMinimizing, "We really need to address your drinking before we can do any therapy."); // Rigid choice

        // --- PHASE 4: ENDINGS (Col 7) ---

        // ENDING 1: CORRECT DIAGNOSIS (Social Anxiety Disorder)
        // Path: nPhysical -> nContextCheck -> nSocialRealization -> End
        // Path: nCognitive -> nGeneralSocial -> nHistory -> End
        const endSAD = await builder.addEnd(
            7, 3,
            "Social Anxiety... yeah. That actually makes sense. I always thought I was just weird or cowardly. If we can work on the fear of judgment, maybe I can perform without the whiskey."
        );

        await builder.connect(nSocialRealization, endSAD, "Leo, because this anxiety happens in social situations—performing, grocery stores—and is driven by a fear of judgment, this fits Social Anxiety Disorder, not just Panic.");
        await builder.connect(nHistory, endSAD, "Your history of hiding to avoid scrutiny, combined with your current struggles, points strongly to Social Anxiety Disorder.");
        await builder.connect(nRootCause, endSAD, "It sounds like you're using alcohol to treat a severe underlying Social Anxiety. If we treat the anxiety, the need to drink might decrease.");

        // ENDING 2: MISDIAGNOSIS - PANIC DISORDER (Focus on physical symptoms)
        const endPanic = await builder.addEnd(
            7, 1,
            "Okay, Panic Disorder. So I just need to learn to breathe through the heart attacks? I guess I can try, but I still feel like people are watching me while I breathe."
        );

        await builder.connect(nFrustrated, endPanic, "Based on the intense physical symptoms you described, we can treat this as Panic Disorder and focus on calming your body.");
        await builder.connect(nPhysical, endPanic, "Those 'heart attack' sensations are classic Panic Attacks. Let's focus on managing those.");

        // ENDING 3: MISDIAGNOSIS - SUBSTANCE ABUSE (Focus only on alcohol)
        const endSubstance = await builder.addEnd(
            7, 5,
            "You sound like my ex. Look, if I stop drinking, I stop playing music. I can't do this sober. If you can't help me with the nerves, I'm wasting my time."
        );

        await builder.connect(nMinimizing, endSubstance, "I'm concerned you have an Alcohol Use Disorder. You need to attend AA meetings before we continue.");
        await builder.connect(nSubstanceDependence, endSubstance, "The primary issue here is the alcohol dependency. We have to stop that first.");

        // ENDING 4: MISDIAGNOSIS - PERFORMANCE ANXIETY ONLY (Too narrow)
        const endPerformance = await builder.addEnd(
            7, 4,
            "Just 'stage fright'? I don't know, doc. I feel like this when I'm ordering a sandwich, not just on stage. But sure, maybe I just need more rehearsal."
        );

        await builder.connect(nPerformanceFocus, endPerformance, "This sounds like specific Performance Anxiety. We can work on visualization techniques for the stage.");
        
        // ENDING 5: DROPOUT (Invalidation)
        const endDropout = await builder.addEnd(
            7, 6,
            "You're not listening. It's not just 'stress.' It feels like my life is ending. I think I'm gonna go."
        );
        
        // Connect random bad choices to dropout
        await builder.connect(nMedicalFocus, endDropout, "Have you tried yoga? It's great for stress.");
    }

    private async createBipolarScenario(correctDiagnosis: ConditionEntity) {
        // 1. Create Scenario Container
        const scenario = await this.scenarioRepo.save(
            this.scenarioRepo.create({
                name: "Case Study: The Late-Night Coder",
                description:
                    "Jordan (20) is a computer science student on academic probation. Presents with 'burnout,' erratic sleep, and falling behind despite bursts of intense productivity.",
                correctDiagnosis: correctDiagnosis,
                initialState: {
                    rapport: 40,
                    bipolar_index: 0,   // Tracks evidence for Hypomania
                    depressive_index: 0, // Tracks evidence for MDD
                    adhd_index: 0,       // Tracks evidence for ADHD
                    substance_suspicion: 0
                }
            })
        );

        // 2. Initialize Builder (Standard Layout)
        const builder = new ScenarioBuilderHelper(scenario, this.nodeRepo, this.choiceRepo, 2400, 500);

        // --- ROOT (Col 0) ---
        const root = await builder.addNode(
            0,
            3,
            NodeType.ROOT,
            "Look, the Dean sent me here because my grades tanked this semester. I just need a note saying I’m burned out so I can get an extension. I was coding 20 hours a day last month, and now I can barely get out of bed."
        );
        scenario.rootDialogueNode = root;
        await this.scenarioRepo.save(scenario);

        // --- PHASE 1: INITIAL INQUIRY (Col 1) ---

        // Path A: Focus on the "Crash" (Depression bias)
        const suDepStart = await builder.addStateUpdate(0.5, 1, "depressive_index", "add", 10);
        const nCrash = await builder.addDialogue(
            1.5,
            1,
            "It’s like hitting a wall. I feel heavy, useless. I slept 14 hours yesterday and woke up tired. I missed three labs because I just couldn't move."
        );

        await builder.connect(root, suDepStart, "That sounds exhausting. Tell me more about what 'barely getting out of bed' looks like for you.");
        await builder.connect(suDepStart, nCrash, "");

        // Path B: Focus on the "20 hours a day" (Hypomania clue)
        const suBpStart = await builder.addStateUpdate(0.5, 3, "bipolar_index", "add", 10);
        const nHigh = await builder.addDialogue(
            1.5,
            3,
            "Oh, that? That was the 'Golden Week.' I rewrote the entire backend for our group project in three days. I felt like I was seeing the Matrix code. I didn't need food, didn't need sleep. I was a god."
        );

        await builder.connect(root, suBpStart, "You mentioned coding 20 hours a day last month. What did that period feel like?");
        await builder.connect(suBpStart, nHigh, "");

        // Path C: Focus on Substance/Lifestyle (Skeptical bias)
        const suSubStart = await builder.addStateUpdate(0.5, 5, "substance_suspicion", "add", 10);
        const nSubstance = await builder.addDialogue(
            1.5,
            5,
            "Just coffee. Okay, maybe a lot of coffee and some energy drinks. And maybe I borrowed some Adderall from a roommate to stay awake during the crash phase, but that didn't even work."
        );

        await builder.connect(root, suSubStart, "Shift work like that usually requires fuel. Are you using anything to keep that pace up?");
        await builder.connect(suSubStart, nSubstance, "");

        // --- PHASE 2: DEEPENING THE INVESTIGATION (Col 2 & 3) ---

        // --- From The Crash (Depression Path) ---
        
        // 2A: Suicidality Check
        const nSafety = await builder.addDialogue(
            2.5, 
            0, 
            "I mean, I don't want to die. I just want to stop feeling like a failure. But yeah, when I'm staring at the ceiling at 2 PM, I wonder if anyone would notice if I vanished."
        );
        await builder.connect(nCrash, nSafety, "When you're feeling that heavy and useless, do you ever have thoughts of hurting yourself?");

        // 2B: Explore the transition (Bridge to Bipolar)
        const suBridgeToBp = await builder.addStateUpdate(2.2, 1, "bipolar_index", "add", 5);
        const nTransition = await builder.addDialogue(
            2.5, 
            1, 
            "It wasn't gradual. One day I was sending fifty emails an hour and planning to start a startup, and the next day... boom. Darkness."
        );
        await builder.connect(nCrash, suBridgeToBp, "Did this exhaustion come on slowly, or was it a sudden shift?");
        await builder.connect(suBridgeToBp, nTransition, "");

        // 2C: Validate Burnout (Missed nuance)
        const nBurnoutAgree = await builder.addDialogue(
            2.5, 
            2, 
            "Exactly. I pushed too hard. I just need rest, right? If I can just sleep for a week, I'll be back to my productive self."
        );
        await builder.connect(nCrash, nBurnoutAgree, "It sounds like classic burnout. You ran your battery dry and now your body is forcing a recharge.");

        // --- From The High (Hypomania Path) ---

        // 2D: Sleep Need Check (Crucial Differential)
        const suSleepCheck = await builder.addStateUpdate(2.2, 3, "bipolar_index", "add", 15);
        const nSleepHigh = await builder.addDialogue(
            2.5, 
            3, 
            "That's the crazy part. I'd sleep maybe 2 hours? And wake up totally refreshed. Better than refreshed, electric. My brain was faster than my fingers."
        );
        await builder.connect(nHigh, suSleepCheck, "During that 'Golden Week,' were you tired but forcing yourself to stay awake, or did you just not need the sleep?");
        await builder.connect(suSleepCheck, nSleepHigh, "");

        // 2E: Quality of Work (Reality Testing)
        const nWorkQuality = await builder.addDialogue(
            2.5, 
            4, 
            "The code compiles... mostly. Looking back, I definitely over-engineered it. And I might have sent a few aggressive emails to the professor telling him his curriculum was outdated. He wasn't happy."
        );
        await builder.connect(nHigh, nWorkQuality, "You said you were a 'god.' Looking back at the work you did then, does it still hold up?");

        // 2F: ADHD Pivot (Common Trap)
        const suAdhdTrap = await builder.addStateUpdate(2.2, 5, "adhd_index", "add", 10);
        const nAdhdPivot = await builder.addDialogue(
            2.5, 
            5, 
            "Always. Since I was a kid. I can hyperfocus on things I like, but boring stuff? Impossible. My mind is like a browser with 100 tabs open."
        );
        await builder.connect(nHigh, suAdhdTrap, "Racing thoughts and intense focus can sometimes be ADHD. Have you always had trouble regulating your attention?");
        await builder.connect(suAdhdTrap, nAdhdPivot, "");

        // --- PHASE 3: CONSEQUENCES & HISTORY (Col 4) ---

        // From nSleepHigh (The clearest Hypomania Indicator)
        const nImpulse = await builder.addDialogue(
            4, 
            3, 
            "Yeah, I spent my entire financial aid check on server equipment I didn't need. And I hooked up with my TA. Which... is complicated now."
        );
        
        await builder.connect(nSleepHigh, nImpulse, "When you felt 'electric,' did you do anything impulsive? Spending money, risky behaviors, or saying things you regretted?");
        
        const nCreative = await builder.addDialogue(
            4, 
            4, 
            "I wrote a screenplay! About a coder who saves the world. It's actually kind of genius. I think I'm going to drop out and pitch it to Netflix."
        );
        await builder.connect(nSleepHigh, nCreative, "Did you take on any other projects besides the coding during that week?");

        // From nTransition (The Bridge)
        const nCycleHistory = await builder.addDialogue(
            4, 
            1, 
            "Yeah, freshman year was the same. A month of partying and acing tests, then a month of darkness. I thought it was just adjusting to college."
        );
        await builder.connect(nTransition, nCycleHistory, "Has this pattern of 'Golden Weeks' followed by crashes happened before?");

        // From nSubstance (The Substance Path)
        const nSubstanceDefense = await builder.addDialogue(
            4, 
            5, 
            "I'm not an addict, okay? I just use what works. When I'm down, I need a boost. When I'm flying, I sometimes drink to slow my brain down so I can actually talk to people."
        );
        await builder.connect(nSubstance, nSubstanceDefense, "It sounds like you're self-medicating to manage these energy swings. Does that feel accurate?");

        // --- PHASE 4: LOGIC GATES & CONVERGENCE (Col 6) ---
        
        // Check Bipolar Index High
        const logicBPHigh = await builder.addLogic(6, 3, "bipolar_index", ">", 20);

        // Check Depressive Index High (but low BP)
        const logicMDDHigh = await builder.addLogic(6, 1, "depressive_index", ">", 10);

        // Connect various paths to logic gates
        await builder.connect(nImpulse, logicBPHigh, "Let's put these pieces together...");
        await builder.connect(nCreative, logicBPHigh, "Let's look at the big picture...");
        await builder.connect(nCycleHistory, logicBPHigh, "Reviewing your history...");
        
        await builder.connect(nSafety, logicMDDHigh, "Considering your low mood...");
        await builder.connect(nBurnoutAgree, logicMDDHigh, "Thinking about the burnout...");

        // --- PHASE 5: DIAGNOSTIC CONCLUSIONS (Col 8) ---

        // 1. THE CORRECT PATH: Bipolar II (Requires High BP Index)
        const nDiagnoseBPII = await builder.addDialogue(
            8, 
            3, 
            "Bipolar? Isn't that where you hallucinate and think you're Jesus? I mean, I felt good, but I wasn't crazy. I just... I don't want to lose the 'Golden Weeks.' That's the only time I'm special."
        );

        // Success outcome logic path (True)
        await builder.connect(logicBPHigh, nDiagnoseBPII, "Jordan, the pattern of 'Golden Weeks' with little sleep followed by heavy crashes sounds like Bipolar II Disorder.", 0);

        const endBPII = await builder.addEnd(
            9, 
            3, 
            "If medication can stop the crash but keep me creative... I guess I'm listening. I can't afford to fail another semester."
        );

        await builder.connect(nDiagnoseBPII, endBPII, "We can aim for stability. The goal isn't to make you flat, but to prevent the crash that's threatening your degree.");
        
        await builder.connect(nDiagnoseBPII, endBPII, "It is a common fear to lose that spark. But treating the mood instability usually helps you be consistently productive, rather than erratic.");
        
        // 2. THE MISDIAGNOSIS: MDD (Missed the highs)
        // Failure logic path from BP High (False) -> goes here if score is low
        // Or True path from MDD logic
        const nDiagnoseMDD = await builder.addDialogue(
            8, 
            1, 
            "Yeah, depression makes sense. Life just feels impossible right now. So, can I get that extension note?"
        );

        await builder.connect(logicBPHigh, nDiagnoseMDD, "I think you are suffering from Major Depression triggered by academic stress.", 1);
        await builder.connect(logicMDDHigh, nDiagnoseMDD, "This looks like a severe episode of Major Depression.", 0);

        const endMDD = await builder.addEnd(
            9, 
            1, 
            "I'll take the antidepressants. Hopefully they give me enough energy to finish this backend code." 
            // CLINICAL NOTE: This is dangerous (SSRIs can trigger mania), representing a fail state in the sim.
        );

        await builder.connect(nDiagnoseMDD, endMDD, "We can start an antidepressant to help lift your mood and energy levels.");

        // 3. THE MISDIAGNOSIS: ADHD (Focused on focus)
        const nDiagnoseADHD = await builder.addDialogue(
            8, 
            5, 
            "Finally. Everyone told me I was just lazy. If I can just get some Ritalin or something, I can actually focus on the boring work, right?"
        );
        
        // Manual connect from ADHD pivot path
        await builder.connect(nAdhdPivot, nDiagnoseADHD, "The racing thoughts and inability to focus on 'boring' tasks points strongly to ADHD.");

        const endADHD = await builder.addEnd(
            9, 
            5, 
            "Okay, let's try the stimulants. Maybe that will stop my brain from jumping around so much."
            // CLINICAL NOTE: Stimulants can worsen mania/anxiety.
        );
        
        await builder.connect(nDiagnoseADHD, endADHD, "We'll treat the attention deficit, which should help you regulate your work output.");

        // 4. THE DISMISSAL: "Just growing pains" (Low Rapport/Bad choices)
        const nDismissal = await builder.addEnd(
            8, 
            7, 
            "You sound like my parents. 'Just sleep more, eat better.' I tried that. It doesn't work. I think I'm done here."
        );

        // Fallback connections for bad paths
        await builder.connect(nWorkQuality, nDismissal, "Honestly, you might just need to improve your time management and sleep hygiene.");
        await builder.connect(nSubstanceDefense, nDismissal, "You need to get clean from the caffeine and pills before we can really see what's wrong.");
    }
}