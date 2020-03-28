import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import UserService from "../../services/user";
const service = new UserService();
import jwt from "jsonwebtoken";

export default class UserController {
  async getEventListController(req: Request, res: Response): Promise<void> {
    const result = await service.getEventListService();
    res.status(200).json({ eventList: result });
  }

  async getEventEntryController(req: Request, res: Response): Promise<void> {
    const result = await service.getEventEntryService(req.params.url);
    res.status(200).json(result);
  }

  async signupController(req: Request, res: Response): Promise<void> {
    const result = await service.signupService(req.body);
    if (result["key"] === "already exist") {
      res.status(409).send("email already exist");
    } else {
      res.status(201).end();
    }
  }

  async signinController(req: Request, res: Response): Promise<void> {
    const result = await service.signinService(req.body);
    if (result["key"] === "unvalid user") {
      res.status(409).send("unvalid user");
    } else {
      res.status(200).json({ token: result["key"], userId: result["id"] });
    }
  }

  async getCouponListController(req: any, res: Response): Promise<void> {
    const tokenInfo = req.tokenData;
    const result = await service.getCouponListService(tokenInfo);
    res.status(200).json({
      couponList: result
    });
  }

  async addCouponController(req: any, res: Response): Promise<void> {
    const userInfo = req.tokenData;
    const result = await service.addCouponService(req.body, userInfo);
    if (result["key"] === "success") {
      res.status(201).send("success");
    } else {
      res.status(409).send("duplicate");
    }
  }

  async deleteCommentController(req: Request, res: Response): Promise<void> {
    const result = await service.deleteCommentService(req.params.commentId);
    res.status(200).json(result);
  }

  async addCommentController(req: any, res: Response): Promise<void> {
    const userInfo = req.tokenData;
    const result = await service.addCommentService(req.body, userInfo);
    res.status(201).json(result);
  }

  async updateCommentController(req: Request, res: Response): Promise<void> {
    await service.updateCommentService(req.body, req.params.commentId);
    res.status(200).end();
  }

  async addThumbController(req: any, res: Response): Promise<void> {
    const userInfo = req.tokenData;
    const result = await service.addThumbService(
      req.params.commentId,
      userInfo
    );
    res.status(200).json(result);
  }

  async removeThumbController(req: any, res: Response): Promise<void> {
    const userInfo = req.tokenData;
    const result = await service.removeThumbService(
      req.params.commentId,
      userInfo
    );
    res.status(200).json(result);
  }

  async getUserThumbsListController(req: any, res: Response): Promise<void> {
    const userInfo = req.tokenData;
    const result = await service.getUserThumbsListService(
      req.params.eventUrl,
      userInfo
    );
    res.status(200).json(result);
  }
}
