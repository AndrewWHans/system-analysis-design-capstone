import { BaseRepository } from "../repository/BaseRepository";
import { TriggerEntity } from "../entity/TriggerEntity";
import { MoodEntity } from "../entity/MoodEntity";
import { CopingMechanismEntity } from "../entity/CopingMechanismEntity";
import { SymptomEntity } from "../entity/SymptomEntity";
import { ConditionEntity } from "../entity/ConditionEntity";
import { DiagnosisEntity } from "../entity/DiagnosisEntity";

export class SeederService {
    constructor(
        private triggerRepo: BaseRepository<TriggerEntity>,
        private moodRepo: BaseRepository<MoodEntity>,
        private copingRepo: BaseRepository<CopingMechanismEntity>,
        private symptomRepo: BaseRepository<SymptomEntity>,
        private conditionRepo: BaseRepository<ConditionEntity>,
        private diagnosisRepo: BaseRepository<DiagnosisEntity>
    ) {}

    async seed() {
        // Check if data already exists to prevent duplicates
        const existingCount = await this.triggerRepo.repo.count();
        if (existingCount > 0) {
            console.log("Database already seeded with clinical data.");
            return;
        }

        console.log("Seeding clinical data...");

        // Create Basic Metadata
        const triggers = await Promise.all([
            this.triggerRepo.save(this.triggerRepo.create({ name: "Social Conflict" })),
            this.triggerRepo.save(this.triggerRepo.create({ name: "Work Stress" })),
            this.triggerRepo.save(this.triggerRepo.create({ name: "Sleep Deprivation" })),
            this.triggerRepo.save(this.triggerRepo.create({ name: "Public Speaking" }))
        ]);

        const moods = await Promise.all([
            this.moodRepo.save(this.moodRepo.create({ name: "Anxious" })),
            this.moodRepo.save(this.moodRepo.create({ name: "Depressed" })),
            this.moodRepo.save(this.moodRepo.create({ name: "Irritable" })),
            this.moodRepo.save(this.moodRepo.create({ name: "Hopeless" }))
        ]);

        const coping = await Promise.all([
            this.copingRepo.save(this.copingRepo.create({ name: "Deep Breathing" })),
            this.copingRepo.save(this.copingRepo.create({ name: "Journaling" })),
            this.copingRepo.save(this.copingRepo.create({ name: "Meditation" })),
            this.copingRepo.save(this.copingRepo.create({ name: "Progressive Muscle Relaxation" }))
        ]);

        // Create Symptoms
        const insomnia = await this.symptomRepo.save(this.symptomRepo.create({
            name: "Insomnia",
            severity: 7,
            frequency: 5,
            duration: 4,
            lifeImpact: 8,
            triggers: [triggers[1], triggers[2]], // Work Stress, Sleep Deprivation
            moods: [moods[2], moods[3]], // Irritable, Hopeless
            copingMechanisms: [coping[2], coping[3]] // Meditation, PMR
        }));

        const panicAttacks = await this.symptomRepo.save(this.symptomRepo.create({
            name: "Panic Attacks",
            severity: 9,
            frequency: 3,
            duration: 1,
            lifeImpact: 9,
            triggers: [triggers[0], triggers[3]], // Social Conflict, Public Speaking
            moods: [moods[0]], // Anxious
            copingMechanisms: [coping[0]] // Deep Breathing
        }));

        const lowEnergy = await this.symptomRepo.save(this.symptomRepo.create({
            name: "Persistent Low Energy",
            severity: 6,
            frequency: 4,
            duration: 5,
            lifeImpact: 7,
            triggers: [triggers[1]],
            moods: [moods[1], moods[3]], // Depressed, Hopeless
            copingMechanisms: [coping[1]] // Journaling
        }));

        // Create Conditions
        const gad = await this.conditionRepo.save(this.conditionRepo.create({
            name: "Generalized Anxiety Disorder",
            symptoms: [panicAttacks, insomnia]
        }));

        const mdd = await this.conditionRepo.save(this.conditionRepo.create({
            name: "Major Depressive Disorder",
            symptoms: [lowEnergy, insomnia]
        }));

        // Create Diagnoses
        await this.diagnosisRepo.save(this.diagnosisRepo.create({
            condition: gad,
        }));

        await this.diagnosisRepo.save(this.diagnosisRepo.create({
            condition: mdd,
        }));

        console.log("Seeding complete.");
    }
}