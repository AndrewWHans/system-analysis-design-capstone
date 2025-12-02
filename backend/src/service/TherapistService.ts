import { TherapistEntity } from "../entity/TherapistEntity";
import { TherapistRepository } from "../repository/TherapistRepository";
import { BadRequestError, UnauthorizedError } from "../utils/AppError"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class TherapistService {
    private therapistRepository: TherapistRepository;

    constructor(therapistRepository: TherapistRepository) {
        this.therapistRepository = therapistRepository;
    }

    async register(username: string | undefined, email: string | undefined, password: string): Promise<TherapistEntity> {
        const u = username?.trim() || null;
        const e = email?.trim() || null;
        const p = password?.trim();

        if (!p) {
            throw new BadRequestError("Password is required");
        }

        if (!u && !e) {
            throw new BadRequestError("At least one of Username or Email is required");
        }

        if (u) {
            try {
                await this.therapistRepository.findByUsername(u);
                throw new Error("Username already taken");
            } catch (err: any) {
                if (err.message === "Username already taken") throw err;
            }
        }

        if (e) {
            try {
                await this.therapistRepository.findByEmail(e);
                throw new Error("Email already taken");
            } catch (err: any) {
                if (err.message === "Email already taken") throw err;
            }
        }

        const hashedPassword = this.hashPassword(p);

        const therapist = this.therapistRepository.create({
            username: u as any,
            email: e as any,
            hashedPassword: hashedPassword,
            isAdmin: false
        });

        return await this.therapistRepository.save(therapist);
    }

    async login(identifier: string, password: string): Promise<string> {
        // Find user by username OR email
        let therapist: TherapistEntity;
        
        try {
            therapist = await this.therapistRepository.findByUsername(identifier);
        } catch (e) {
            try {
                therapist = await this.therapistRepository.findByEmail(identifier);
            } catch (e2) {
                throw new UnauthorizedError("Invalid credentials");
            }
        }

        // Compare password to hashed password
        const isMatch = bcrypt.compareSync(password, therapist.hashedPassword);
        
        if (!isMatch) {
            throw new UnauthorizedError("Invalid credentials");
        }

        // Generate real JWT as session token
        const secret = process.env.JWT_SECRET || "fallback_secret";
        const token = jwt.sign(
            { 
                userId: therapist.id, 
                username: therapist.username, 
                email: therapist.email,
                isAdmin: therapist.isAdmin 
            },
            secret,
            { expiresIn: "24h" }
        );

        return token;
    }

    async createAdmin(): Promise<void> {
        const adminUsername = "admin";
        const adminPassword = "admin";

        let exists = false;
        try {
            await this.therapistRepository.findByUsername(adminUsername);
            exists = true;
        } catch {}

        if (exists) {
            console.log("Admin user already exists");
            return;
        }

        console.log("Creating admin user...");
        const hashedPassword = this.hashPassword(adminPassword);
        const admin = this.therapistRepository.create({
            username: adminUsername,
            hashedPassword: hashedPassword,
            isAdmin: true
        });
        await this.therapistRepository.save(admin);
        console.log("Admin user created successfully");
    }

    hashPassword(password: string): string {
        return bcrypt.hashSync(password, 10);
    }
}