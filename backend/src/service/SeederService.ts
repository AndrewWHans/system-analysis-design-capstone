import { BaseRepository } from "../repository/BaseRepository";
import { TriggerEntity } from "../entity/TriggerEntity";
import { MoodEntity } from "../entity/MoodEntity";
import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { SymptomEntity } from "../entity/SymptomEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { ScenarioEntity } from "../entity/ScenarioEntity";
import { DialogueNodeEntity } from "../entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "../entity/TherapistChoiceEntity";

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
            console.log("Database already seeded with clinical data.");
            return;
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
                name: "Anhedonia", severity: 8, frequency: 5, duration: 4, lifeImpact: 9,
                triggers: ["Perceived Failure", "Loneliness", "Chronic Pain"],
                moods: ["Apathetic", "Numb", "Empty"],
                coping: ["Isolation", "Excessive Sleeping", "Substance Use"]
            },
            {
                name: "Psychomotor Agitation", severity: 7, frequency: 4, duration: 2, lifeImpact: 6,
                triggers: ["Anxious", "Work Stress", "Caffeine Overload"],
                moods: ["Restless", "Irritable", "Anxious"],
                coping: ["Exercise", "Nail Biting", "Pacing"] // Pacing assumed implied
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

        console.log("Clinical data seeded. Creating complex scenario...");

        // Case Study: The Overwhelmed Architect
        // Condition: Generalized Anxiety Disorder
        
        await this.createAnxietyScenario(conditionMap.get("Generalized Anxiety Disorder"));

        console.log("Seeding complete.");
    }

    private async createAnxietyScenario(correctDiagnosis: ConditionEntity) {
        // reate scenario container
        const scenario = await this.scenarioRepo.save(this.scenarioRepo.create({
            name: "Case Study: The Overwhelmed Architect",
            description: "Alex (27) is a junior architect who recently received a major promotion. Since accepting the role two months ago, Alex reports feeling 'on edge' constantly, having trouble sleeping, and worrying excessively about minor details in blueprints. Alex fears being fired despite positive feedback.",
            correctDiagnosis: correctDiagnosis
        }));

        // Helper to create nodes
        const createNode = async (text: string, x: number, y: number, isEnd = false) => {
            return await this.nodeRepo.save(this.nodeRepo.create({
                botText: text,
                uiX: x,
                uiY: y,
                isEndNode: isEnd,
                scenario: scenario
            }));
        };

        // Helper to create choices
        const linkNode = async (src: DialogueNodeEntity, target: DialogueNodeEntity, text: string, order = 0) => {
            await this.choiceRepo.save(this.choiceRepo.create({
                sourceNode: src,
                nextNode: target,
                text: text,
                orderIndex: order
            }));
        };

        // X positions per "level" to make a clear left-to-right flow
        const X0 = 0;    // Intro
        const X1 = 1800;   // Initial investigation
        const X2 = 3600;   // Physical / cognitive / self-doubt / strengths
        const X3 = 5400;  // Sleep / coping / functioning / history
        const X4 = 7200;  // Timeline / panic / risk / values
        const X5 = 9000;  // Rule-outs
        const X6 = 10800;  // Endings

        // Y step for vertical spacing
        const Y_STEP = 600;

        // -------------------------
        // LEVEL 0: INTRO
        // -------------------------
        const nRoot = await createNode(
            "Hi there. Thanks for seeing me on such short notice. I... I feel like I'm losing my grip on things at work, and it's starting to bleed into everything else.",
            X0,
            3 * Y_STEP // centered-ish
        );
        scenario.rootDialogueNode = nRoot;
        await this.scenarioRepo.save(scenario);

        // -------------------------
        // LEVEL 1: INITIAL INVESTIGATION
        // -------------------------
        const nExplode = await createNode(
            "It's just everything. The deadlines, the emails. I stare at my screen for hours afraid to make a line on a drawing because if it's wrong, the building falls down. Logically I know that's stupid, but I can't stop the thought.",
            X1,
            1 * Y_STEP
        );

        const nVague = await createNode(
            "I don't know, just stress I guess. New job. Big expectations. Maybe I'm just not cut out for it.",
            X1,
            2 * Y_STEP
        );

        const nContext = await createNode(
            "The promotion sounded great on paper. More responsibility, bigger projects. But ever since, it feels like there's this spotlight on me. Like every tiny mistake will prove they picked the wrong person.",
            X1,
            3 * Y_STEP
        );

        const nRapport = await createNode(
            "I mean, I’ve always been the 'responsible one'. People expect me to handle things. So I didn't exactly tell anyone I'm freaking out. I just keep saying I'm fine.",
            X1,
            4 * Y_STEP
        );

        // Root choices (4 options)
        await linkNode(
            nRoot,
            nExplode,
            "When you say 'losing your grip', can you walk me through a specific moment when that feeling shows up most strongly?",
            0
        );
        await linkNode(
            nRoot,
            nVague,
            "It sounds like this new role is carrying a lot of weight for you. What makes you wonder if you're 'not cut out for it'?",
            1
        );
        await linkNode(
            nRoot,
            nContext,
            "Tell me a bit more about the promotion itself—what changed day to day for you?",
            2
        );
        await linkNode(
            nRoot,
            nRapport,
            "Before we get into details, how have you been coping with all of this on your own so far?",
            3
        );

        // -------------------------
        // LEVEL 2: PHYSICAL / COGNITIVE / SELF-DOUBT / STRENGTHS
        // -------------------------
        const nPhysical = await createNode(
            "My stomach is in knots every morning. I get these tension headaches by 2 PM that feel like a vice. And my heart... sometimes it beats so hard I can hear it in my ears during meetings.",
            X2,
            1 * Y_STEP
        );

        const nCognitive = await createNode(
            "My mind won't shut off. Even when I'm home, I'm mentally drafting emails or re-checking calculations I did hours ago. It's like I have 50 browser tabs open and they're all frozen.",
            X2,
            2 * Y_STEP
        );

        const nDefensive = await createNode(
            "Look, I just need something to help me focus. I'm tired. I'm not crazy.",
            X2,
            3 * Y_STEP
        );

        const nImposter = await createNode(
            "It feels like everyone else knows what they’re doing, and I'm pretending. Every time I submit a drawing, I wait for someone to say, 'Wow, this is amateur hour.'",
            X2,
            4 * Y_STEP
        );

        const nStrengths = await createNode(
            "I mean, I know I'm good at what I do. I graduated near the top of my class, and my mentor said I had 'an eye for detail'. I just... don't trust that right now.",
            X2,
            5 * Y_STEP
        );

        // From nExplode
        await linkNode(
            nExplode,
            nPhysical,
            "That sounds really intense. When you're frozen like that at your screen, what happens in your body?",
            0
        );
        await linkNode(
            nExplode,
            nCognitive,
            "You mentioned you can't stop the thought. What's the mental loop like when you're away from the computer?",
            1
        );
        await linkNode(
            nExplode,
            nImposter,
            "It sounds like you're carrying a lot of responsibility. Do you ever feel like an 'imposter' in this role?",
            2
        );

        // From nVague
        await linkNode(
            nVague,
            nExplode,
            "A lot of people say 'just stress' when it’s actually overwhelming. Can we slow it down and look at a specific example from this week?",
            0
        );
        await linkNode(
            nVague,
            nDefensive,
            "When you say maybe you're not cut out for it, is that something you've heard from others or more of an internal voice?",
            1
        );
        await linkNode(
            nVague,
            nStrengths,
            "Before this promotion, what kind of feedback were you getting about your work and abilities?",
            2
        );

        // From nContext
        await linkNode(
            nContext,
            nCognitive,
            "That 'spotlight' image is powerful. How does your mind react when you imagine being under that microscope?",
            0
        );
        await linkNode(
            nContext,
            nPhysical,
            "As you describe that pressure, what do you notice in your body right now?",
            1
        );
        await linkNode(
            nContext,
            nImposter,
            "Do you ever find yourself thinking they made a mistake choosing you?",
            2
        );

        // From nRapport
        await linkNode(
            nRapport,
            nDefensive,
            "Being the 'responsible one' can make it harder to ask for help. What makes it difficult to let people see you're struggling?",
            0
        );
        await linkNode(
            nRapport,
            nStrengths,
            "People expecting a lot from you usually means you've shown them you can handle things. What strengths do you think they see in you?",
            1
        );
        await linkNode(
            nRapport,
            nCognitive,
            "On the outside you’re saying 'I’m fine.' On the inside, what does the mental noise sound like?",
            2
        );

        // -------------------------
        // LEVEL 3: SLEEP, COPING, FUNCTIONING, HISTORY, SUPPORT
        // -------------------------
        const nSleep = await createNode(
            "Sleep? What sleep? I lay there for three hours staring at the ceiling. When I do sleep, I dream about work. I wake up with my jaw clenched.",
            X3,
            1 * Y_STEP
        );

        const nCopingBad = await createNode(
            "I drink about 6 coffees to get through the morning. At night... a few glasses of wine helps take the edge off, but then I wake up at 3 AM anyway.",
            X3,
            2 * Y_STEP
        );

        const nFunctioning = await createNode(
            "I'm still getting things done, technically. But I triple-check everything, so it takes twice as long. My inbox is a disaster because I'm scared to open half the emails.",
            X3,
            3 * Y_STEP
        );

        const nHistory = await createNode(
            "Honestly, I've always been a worrier. In school, I'd reread emails to professors like ten times before sending. This is the first time it's felt like it's taking over my whole life, though.",
            X3,
            4 * Y_STEP
        );

        const nSupport = await createNode(
            "My partner says I'm ‘never really home’ even when I’m on the couch. My friends have stopped inviting me out as much because I keep saying I'm busy or too tired.",
            X3,
            5 * Y_STEP
        );

        // From Physical
        await linkNode(
            nPhysical,
            nSleep,
            "Those headaches and heart pounding can be your body’s alarm system. How has all of this affected your sleep?",
            0
        );
        await linkNode(
            nPhysical,
            nCopingBad,
            "When your body feels like that, what do you usually do to get through the day or calm down at night?",
            1
        );
        await linkNode(
            nPhysical,
            nFunctioning,
            "How do these physical symptoms impact your ability to get through a typical workday?",
            2
        );

        // From Cognitive
        await linkNode(
            nCognitive,
            nSleep,
            "That many mental 'tabs' would exhaust anyone. Do those racing thoughts follow you into bedtime?",
            0
        );
        await linkNode(
            nCognitive,
            nHistory,
            "Have you noticed this kind of constant worry at other times in your life, or is it new with the promotion?",
            1
        );
        await linkNode(
            nCognitive,
            nFunctioning,
            "How is that nonstop thinking affecting your concentration and productivity at work?",
            2
        );

        // From Defensive
        await linkNode(
            nDefensive,
            nCopingBad,
            "I hear that you're exhausted and want relief. What are you using right now—caffeine, alcohol, anything else—to push through?",
            0
        );
        await linkNode(
            nDefensive,
            nSleep,
            "I'm not questioning your sanity. I'm interested in your exhaustion—what does a typical night of sleep look like lately?",
            1
        );
        await linkNode(
            nDefensive,
            nHistory,
            "Needing help doesn’t mean you’re 'crazy'. Has feeling this keyed up ever shown up earlier in your life?",
            2
        );

        // From Imposter
        await linkNode(
            nImposter,
            nHistory,
            "That fear of being 'found out' can go way back. Have you felt that in other situations, like school or previous jobs?",
            0
        );
        await linkNode(
            nImposter,
            nFunctioning,
            "How does that 'they’ll find out' thought affect the way you approach tasks and deadlines?",
            1
        );
        await linkNode(
            nImposter,
            nSupport,
            "Who in your life, if anyone, knows you're feeling this much pressure?",
            2
        );

        // From Strengths
        await linkNode(
            nStrengths,
            nSupport,
            "It sounds like you’ve had genuine competence and support in the past. Right now, who’s in your corner while you’re going through this?",
            0
        );
        await linkNode(
            nStrengths,
            nFunctioning,
            "Having an 'eye for detail' can be a strength and a burden. How is that perfectionism showing up in your day-to-day tasks?",
            1
        );
        await linkNode(
            nStrengths,
            nHistory,
            "You’ve been capable for a long time. Have worries like this been background noise for years, or do they feel more recent?",
            2
        );

        // -------------------------
        // LEVEL 4: PANIC SPIKES, TIMELINE, RISK, VALUES, RELATIONSHIP STRAIN
        // -------------------------
        const nTimeline = await createNode(
            "Since the promotion, about two months ago. But honestly? I've always been a 'worrier'. Even in college, I'd double-check papers ten times. It's just... unmanageable now.",
            X4,
            1 * Y_STEP
        );

        const nPanic = await createNode(
            "Yesterday I had to leave a meeting because I felt like the walls were closing in. I hid in the bathroom for 20 minutes. I can't let that happen again.",
            X4,
            2 * Y_STEP
        );

        const nRisk = await createNode(
            "I'm not going to hurt myself or anything. I just fantasize about quitting, moving somewhere nobody knows me, and starting over. Then I panic because I know I can’t just walk away.",
            X4,
            3 * Y_STEP
        );

        const nValues = await createNode(
            "I actually love architecture. I like creating spaces people will live in. I just hate that my brain turns every project into a life-or-death exam.",
            X4,
            4 * Y_STEP
        );

        const nRelationshipStrain = await createNode(
            "My partner says I'm 'married to my inbox'. We argue more because I'm distracted or snappy. I cancel on friends last minute, then feel guilty and even more anxious.",
            X4,
            5 * Y_STEP
        );

        // From Sleep
        await linkNode(
            nSleep,
            nTimeline,
            "That pattern of lying awake and dreaming about work sounds brutal. When did you first start noticing your sleep getting this bad?",
            0
        );
        await linkNode(
            nSleep,
            nRisk,
            "Long-term sleep loss can really wear people down. Have things ever felt so overwhelming that you thought about quitting or giving up in some way?",
            1
        );
        await linkNode(
            nSleep,
            nValues,
            "Despite the exhaustion, what keeps you showing up to work each day?",
            2
        );

        // From CopingBad
        await linkNode(
            nCopingBad,
            nPanic,
            "That 3 AM wake-up after wine sounds like rebound anxiety. Have there been moments where the anxiety felt so intense you had to escape the situation?",
            0
        );
        await linkNode(
            nCopingBad,
            nTimeline,
            "Using caffeine and alcohol to manage this is common, but it can feed the cycle. How long have you been relying on them this heavily?",
            1
        );
        await linkNode(
            nCopingBad,
            nRisk,
            "When the anxiety peaks after those nights, do you ever have thoughts that worry you about your safety or future?",
            2
        );

        // From Functioning
        await linkNode(
            nFunctioning,
            nTimeline,
            "You’re functioning, but at a high cost. When did work shift from 'busy' to 'unmanageable' in this way?",
            0
        );
        await linkNode(
            nFunctioning,
            nPanic,
            "Avoiding emails and triple-checking work are big signs of anxiety. Have there been situations where your body seemed to 'shut down' or 'freak out' at work?",
            1
        );
        await linkNode(
            nFunctioning,
            nValues,
            "Given how draining this is, what keeps you invested in architecture as a career?",
            2
        );

        // From History
        await linkNode(
            nHistory,
            nTimeline,
            "So worry has been around for a long time. What feels different about the last couple of months?",
            0
        );
        await linkNode(
            nHistory,
            nValues,
            "Even with all that lifelong worry, what parts of your life have still felt meaningful or enjoyable?",
            1
        );
        await linkNode(
            nHistory,
            nRisk,
            "Sometimes when worry ramps up from 'manageable' to 'unmanageable', people start to feel stuck or trapped. Does that resonate for you?",
            2
        );

        // From Support
        await linkNode(
            nSupport,
            nRelationshipStrain,
            "It sounds like your relationships are feeling the impact too. How are things with your partner and friends these days?",
            0
        );
        await linkNode(
            nSupport,
            nRisk,
            "When the people around you are frustrated and you’re exhausted, does it ever feel like you just want to disappear from all of it?",
            1
        );
        await linkNode(
            nSupport,
            nValues,
            "Who or what in your life feels most important to you right now, even in the middle of all this stress?",
            2
        );

        // -------------------------
        // LEVEL 5: RULE-OUTS & DIAGNOSTIC CLARIFICATION
        // -------------------------
        const nRuleOutDepression = await createNode(
            "No, I'm not sad. I still enjoy things when I'm not worrying. I still want to see my friends, I'm just too keyed up to sit still. I'm not hopeless, I'm just... vibrating.",
            X5,
            1 * Y_STEP
        );

        const nRuleOutPanic = await createNode(
            "It wasn't a heart attack feeling, just an overwhelming urge to escape. It's not sudden attacks out of nowhere, it's this constant hum of dread that spikes when I'm put on the spot.",
            X5,
            2 * Y_STEP
        );

        const nRuleOutOCD = await createNode(
            "I don’t have rituals or anything like that. I mean, I double-check things a lot, but it’s more because I’m scared of messing up, not like I 'have to' do it a certain way to feel safe.",
            X5,
            3 * Y_STEP
        );

        const nRuleOutBipolar = await createNode(
            "I don't have those super-high, wired phases people talk about. This is more like being constantly revved up and exhausted at the same time. No risky shopping sprees or anything.",
            X5,
            4 * Y_STEP
        );

        // From Timeline
        await linkNode(
            nTimeline,
            nRuleOutDepression,
            "You’ve mentioned being a worrier more than feeling sad. Do you ever feel hopeless or lose interest in things you usually enjoy?",
            0
        );
        await linkNode(
            nTimeline,
            nRuleOutBipolar,
            "Have there been times where your mood shoots way up—needing very little sleep, feeling invincible, or taking big risks out of character?",
            1
        );
        await linkNode(
            nTimeline,
            nRuleOutOCD,
            "You’ve described a lot of checking and re-checking. Do you ever feel driven to do specific rituals or routines to neutralize certain thoughts?",
            2
        );

        // From Panic
        await linkNode(
            nPanic,
            nRuleOutPanic,
            "That bathroom incident sounds like a spike in anxiety. Do you tend to get sudden attacks 'out of the blue', or is it more like a steady hum that rises in certain situations?",
            0
        );
        await linkNode(
            nPanic,
            nRuleOutDepression,
            "After moments like that, do you feel more down and hopeless, or mostly keyed up and afraid it will happen again?",
            1
        );
        await linkNode(
            nPanic,
            nRuleOutOCD,
            "When you left that meeting, was it because of a specific intrusive thought you had to neutralize, or more a general fear of something going wrong?",
            2
        );

        // From Risk
        await linkNode(
            nRisk,
            nRuleOutDepression,
            "It’s important that you’re not thinking of hurting yourself. When things feel that overwhelming, do you feel more empty and numb, or more tense and wound up?",
            0
        );
        await linkNode(
            nRisk,
            nRuleOutBipolar,
            "Sometimes people swing between wanting to quit everything and feeling on top of the world. Have you noticed big mood swings like that?",
            1
        );
        await linkNode(
            nRisk,
            nRuleOutPanic,
            "Those fantasies of escaping—do they come with sudden physical surges of fear, or are they more like ongoing worry about being trapped?",
            2
        );

        // From Values / RelationshipStrain
        await linkNode(
            nValues,
            nRuleOutDepression,
            "Even under all this stress, you still care about architecture and relationships. Do you feel more anxious than sad overall?",
            0
        );
        await linkNode(
            nRelationshipStrain,
            nRuleOutDepression,
            "Conflict and guilt can definitely drain people. Do you mostly feel down, or more tense and on edge?",
            1
        );
        await linkNode(
            nRelationshipStrain,
            nRuleOutPanic,
            "When arguments happen, does your anxiety show up more as out-of-the-blue panic, or as a buildup that finally spills over?",
            2
        );

        // -------------------------
        // LEVEL 6: ENDINGS / FORMULATION
        // -------------------------
        const nEndPsychoeducation = await createNode(
            "That makes sense. It feels like my alarm system is stuck in the 'on' position. If we can turn the volume down, I think I can handle the job. I want to handle the job.",
            X6,
            1.5 * Y_STEP,
            true
        );

        const nEndSleepFocus = await createNode(
            "Maybe. I just need to sleep. If you can help with that, I'll try whatever.",
            X6,
            2.5 * Y_STEP,
            true
        );

        const nEndSkillsFocus = await createNode(
            "If this is anxiety and not me being 'broken', that actually helps. I’d like to learn some tools so I’m not triple-checking every line just to feel okay.",
            X6,
            3.5 * Y_STEP,
            true
        );

        // From Rule-Out Nodes → Multiple Ending Styles
        await linkNode(
            nRuleOutDepression,
            nEndPsychoeducation,
            "It sounds like the primary issue isn’t depression, but a chronic, high level of anxiety that’s been amplified by the promotion. We’d call that Generalized Anxiety Disorder—your alarm system stuck on high.",
            0
        );
        await linkNode(
            nRuleOutDepression,
            nEndSkillsFocus,
            "Given that your enjoyment is still there underneath the worry, I’m thinking in terms of Generalized Anxiety Disorder. We can focus on skills to manage the worry rather than seeing you as 'broken'.",
            1
        );

        await linkNode(
            nRuleOutPanic,
            nEndPsychoeducation,
            "The way you describe that constant hum of dread with spikes in certain situations fits Generalized Anxiety Disorder more than classic panic disorder. We can work on lowering that background volume.",
            0
        );
        await linkNode(
            nRuleOutPanic,
            nEndSleepFocus,
            "These spikes seem to grow out of a constant base level of stress—consistent with Generalized Anxiety Disorder. A first target could be sleep and physical tension so your system can reset.",
            1
        );

        await linkNode(
            nRuleOutOCD,
            nEndSkillsFocus,
            "Your checking seems driven by worry about performance, not rigid rituals or fears that something terrible will happen unless you do things 'just right'. That again points to Generalized Anxiety Disorder, not OCD.",
            0
        );
        await linkNode(
            nRuleOutOCD,
            nEndPsychoeducation,
            "Given there aren’t fixed rituals or compulsions, this looks more like anxiety about responsibility than OCD. That fits Generalized Anxiety Disorder, which we can treat with skills and sometimes medication.",
            1
        );

        await linkNode(
            nRuleOutBipolar,
            nEndPsychoeducation,
            "The absence of those extreme highs suggests we’re not dealing with bipolar disorder. Instead, this long-standing pattern of worry and physical tension aligns with Generalized Anxiety Disorder.",
            0
        );
        await linkNode(
            nRuleOutBipolar,
            nEndSleepFocus,
            "Since you’re not describing big mood swings, I’m less concerned about bipolar and more about chronic anxiety. Starting with stabilizing sleep and reducing tension often helps people with Generalized Anxiety Disorder.",
            1
        );

        // Safety net: connect a more guarded path directly to an end node
        await linkNode(
            nDefensive,
            nEndSleepFocus,
            "We can absolutely start by targeting sleep and focus. My working impression is Generalized Anxiety Disorder, and treatment often begins with getting your nervous system a chance to rest.",
            3
        );
    }

}