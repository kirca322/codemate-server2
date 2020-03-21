import dotenv from "dotenv";
dotenv.config();
import { Request, Response } from "express";
import adminService from "../../services/admin";
import { Events } from "../../entity/Events";
import { getRepository } from "typeorm";
import jwt from "jsonwebtoken";

const service = new adminService();

export interface MulterFile {
  key: string; // Available using `S3`.
  path: string; // Available using `DiskStorage`.
  mimetype: string;
  originalname: string;
  size: number;
}

export default {
  addEventController: async (
    req: Request & { files: MulterFile[] },
    res: Response
  ): Promise<void> => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).end();
      if (decoded) {
        const data = req.body;
        if (req.files["pageImage"]) {
          data.pageImage = req.files["pageImage"][0].location;
          data.bannerImage = req.files["bannerImage"][0].location;
          data.buttonImage = req.files["buttonImage"][0].location;
        }
        const result = await service.addEventService(data);
        if (result["key"] === "detailPageUrl") {
          res.status(409).send("detailPageUrl");
        } else {
          res.status(201).end();
        }
      }
    });
    // const data = req.body;
    // if (req.files["pageImage"]) {
    //   data.pageImage = req.files["pageImage"][0].location;
    //   data.bannerImage = req.files["bannerImage"][0].location;
    //   data.buttonImage = req.files["buttonImage"][0].location;
    // }
    // const result = await service.addEventService(data);
    // if (result["key"] === "detailPageUrl") {
    //   res.status(409).send("detailPageUrl");
    // } else {
    //   res.status(201).end();
    // }
  },

  putEventController: async (
    req: Request & { files: MulterFile[] },
    res: Response
  ): Promise<void> => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).end();
      if (decoded) {
        const data = req.body;
        if (req.files["pageImage"]) {
          data.pageImage = req.files["pageImage"][0].location;
        }
        if (req.files["bannerImage"]) {
          data.bannerImage = req.files["bannerImage"][0].location;
        }
        if (req.files["buttonImage"]) {
          data.buttonImage = req.files["buttonImage"][0].location;
        }
        const result = await service.putEventService(data, req.params.id);
        if (result["key"] === "detailPageUrl") {
          res.status(409).send("detailPageUrl");
        } else {
          res.status(200).end();
        }
      }
    });

    // const data = req.body;
    // if (req.files["pageImage"]) {
    //   data.pageImage = req.files["pageImage"][0].location;
    // }
    // if (req.files["bannerImage"]) {
    //   data.bannerImage = req.files["bannerImage"][0].location;
    // }
    // if (req.files["buttonImage"]) {
    //   data.buttonImage = req.files["buttonImage"][0].location;
    // }
    // const result = await service.putEventService(data, req.params.id);
    // if (result["key"] === "detailPageUrl") {
    //   res.status(409).send("detailPageUrl");
    // } else {
    //   res.status(200).end();
    // }
  },

  getEventListController: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).end();
      if (decoded) {
        const result = await service.getEventListService();
        res.status(200).json({ eventList: result });
      }
    });

    // const result = await service.getEventListService();
    // res.status(200).json({ eventList: result });
  },

  getEventEntryController: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).end();
      if (decoded) {
        const result = await service.getEventEntryService(req.params.id);
        res.status(200).json(result);
      }
    });

    // const result = await service.getEventEntryService(req.params.id);
    // res.status(200).json(result);
  },

  deleteEventController: async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).end();
      if (decoded) {
        await service.deleteEventService(req.params.id);
        res.status(200).end();
      }
    });

    // await service.deleteEventService(req.params.id);
    // res.status(200).end();
  },

  signinController: async (req: Request, res: Response): Promise<void> => {
    // console.log("여기!!!!!!!!!!!!!", req.body);
    const result = await service.signinService(req.body);
    if (result["key"] !== "unvalid user") {
      res.status(200).json({ token: result["key"] });
    } else {
      res.status(409).send("unvaild user");
    }
  }
};
