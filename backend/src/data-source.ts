import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { TherapistEntity } from "./entity/TherapistEntity";
import { ScenarioEntity } from "./entity/ScenarioEntity";
import { DialogueNodeEntity } from "./entity/DialogueNodeEntity";
import { TherapistChoiceEntity } from "./entity/TherapistChoiceEntity";
import { TherapySessionEntity } from "./entity/TherapySessionEntity";
import { MessageEntity } from "./entity/MessageEntity";
import { ConditionEntity } from "./entity/ConditionEntity";
import { SymptomEntity } from "./entity/SymptomEntity";
import { TriggerEntity } from "./entity/TriggerEntity";
import { MoodEntity } from "./entity/MoodEntity";
import { CopingMechanismEntity } from "./entity/CopingMechanismEntity";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [
        TherapistEntity,
        ScenarioEntity,
        DialogueNodeEntity,
        TherapistChoiceEntity,
        TherapySessionEntity,
        MessageEntity,
        ConditionEntity,
        SymptomEntity,
        TriggerEntity,
        MoodEntity,
        CopingMechanismEntity
    ],
    subscribers: [],
    migrations: [],
});