import { Request, Response } from "express";
import { BaseService } from "../service/BaseService";
import { ObjectLiteral } from "typeorm";

export class BaseController<T extends ObjectLiteral> {
    constructor(private service: BaseService<T>) {}

    getAll = async (req: Request, res: Response) => {
        const items = await this.service.getAll();
        res.json(items);
    };

    getById = async (req: Request, res: Response) => {
        const item = await this.service.getByID(Number(req.params.id));
        res.json(item);
    };

    create = async (req: Request, res: Response) => {
        const item = await this.service.create(req.body);
        res.status(201).json(item);
    };

    update = async (req: Request, res: Response) => {
        await this.service.update(Number(req.params.id), req.body);
        res.json({ message: "Updated successfully" });
    };

    delete = async (req: Request, res: Response) => {
        await this.service.delete(Number(req.params.id));
        res.json({ message: "Deleted successfully" });
    };
}