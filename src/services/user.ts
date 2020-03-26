import dotenv from "dotenv";
dotenv.config();
import { getRepository } from "typeorm";
import { Events } from "../database/entity/Events";
import { User } from "../database/entity/User";
import { Coupon } from "../database/entity/Coupon";
import { Comment } from "../database/entity/Comment";
import { UserCoupon } from "../database/entity/UserCoupon";
import { UserThumbs } from "../database/entity/UserThumbs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

enum couponState {
  enable,
  disable,
  canceled
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  mobile: string;
  address: string;
}

interface SigninData {
  email: string;
  password: string;
}

const getRecentTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  let month = (now.getMonth() + 1).toString();
  month = Number(month) < 10 ? "0" + month : month;
  const date = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const result = "" + year + month + date + hour + minute;
  return result;
};

interface CouponData {
  couponName: string;
  couponCode: string;
  description: string;
  period: number;
  discount: string;
  expiredAt: string;
}

export default class UserService {
  async getEventListService(): Promise<object> {
    const result = await getRepository(Events).find({
      select: [
        "id",
        "eventTitle",
        "startDate",
        "endDate",
        "detailPageUrl",
        "bannerImage"
      ],
      where: {
        isDeleted: false
      }
    });
    return result;
  }

  async getEventEntryService(url: string): Promise<object> {
    const eventInfo = await getRepository(Events).findOne({
      where: {
        detailPageUrl: `/${url}`,
        isDeleted: false
      }
    });
    const couponInfo = await getRepository(Coupon).findOne({
      where: {
        couponCode: eventInfo.couponCode ? eventInfo.couponCode : null
      }
    });

    ////////////////////////////////////////////////
    const commentListInfo = await getRepository(Comment).find({
      select: ["id", "userId", "content", "createdAt", "thumb"],
      where: {
        eventId: eventInfo.id
      }
    });
    const userInfo = await getRepository(User).find({
      select: ["id", "name"],
      where: commentListInfo.map(x => {
        return {
          id: x.userId
        };
      })
    });
    for (let i = 0; i < userInfo.length; i++) {
      commentListInfo[i]["userId"] = userInfo[i].id;
      commentListInfo[i]["userName"] = userInfo[i].name;
    }
    ////////////////////////////////////////////////
    const result = {
      ...eventInfo,
      period: couponInfo ? couponInfo.period : null,
      commentList: commentListInfo
    };
    return result;
  }

  async signupService(data: SignupData): Promise<object> {
    const result = await getRepository(User).findOne({
      where: {
        email: data.email
      }
    });
    if (result) {
      return { key: "already exist" };
    }
    const shasum = crypto.createHmac("sha512", process.env.CRYPTO_SECRET_KEY);
    shasum.update(data.password);
    data.password = shasum.digest("hex");
    const user = new User();
    const forInsertData = {
      ...user,
      ...data
    };
    await getRepository(User).save(forInsertData);
    return { key: "completed" };
  }

  async signinService(data: SigninData): Promise<object> {
    const shasum = crypto.createHmac("sha512", process.env.CRYPTO_SECRET_KEY);
    shasum.update(data.password);
    data.password = shasum.digest("hex");
    const result = await getRepository(User).findOne({
      where: {
        email: data.email,
        password: data.password
      }
    });
    if (result) {
      const token = jwt.sign(
        {
          id: result.id,
          email: result.email
        },
        process.env.JWT_USER_SECRET_KEY,
        {
          expiresIn: "1h"
        }
      );
      return { key: token, id: result.id };
    } else {
      return { key: "unvalid user" };
    }
  }

  async getCouponListService(tokenInfo): Promise<object> {
    const userInfo = await getRepository(User).findOne({
      where: {
        id: tokenInfo.id
      }
    });
    const userCouponInfo = await getRepository(UserCoupon).find({
      where: {
        userId: userInfo.id,
        isDeleted: couponState.enable
      }
    });
    const recentTime = getRecentTime();
    const filteredUserCouponInfo = [];
    await userCouponInfo.forEach(async x => {
      if (Number(x.expiredAt) > Number(recentTime)) {
        filteredUserCouponInfo.push(x);
      } else {
        x.isDeleted = couponState.canceled;
        await getRepository(UserCoupon).save(x);
      }
    });
    const couponInfo = await getRepository(Coupon).find({
      where: filteredUserCouponInfo.map(x => {
        return { id: x.couponId };
      })
    });
    const result = [];
    for (let i = 0; i < filteredUserCouponInfo.length; i++) {
      result.push({
        couponName: couponInfo[i].couponName,
        description: couponInfo[i].description,
        expiredAt: filteredUserCouponInfo[i].expiredAt
      });
    }
    return result;
  }
  async addCouponService(data: CouponData, info): Promise<object> {
    // // 해당 이벤트의 쿠폰정보를 조회
    const coupon = await getRepository(Coupon).findOne({
      where: {
        couponCode: data.couponCode
      }
    });
    // // 조회한 쿠폰을 이미 가지고 있을 경우 중복처리
    const inData = await getRepository(UserCoupon).findOne({
      where: {
        userId: info.id,
        couponId: coupon.id
      }
    });
    if (inData) {
      return { key: "duplicate" };
    }
    // 쿠폰을 생성
    const forInsertData = {
      couponId: coupon.id,
      userId: info.id,
      expiredAt: data.expiredAt
    };
    await getRepository(UserCoupon).save(forInsertData);
    return { key: "success" };
  }

  async deleteCommentService(commentId): Promise<void> {
    const comment = await getRepository(Comment).findOne({
      where: {
        id: commentId
      }
    });
    comment.isDeleted = true;
    await getRepository(UserThumbs).delete({ commentId });
    await getRepository(Comment).save(comment);
  }

  async updateCommentService(data, commentId): Promise<void> {
    const comment = await getRepository(Comment).findOne({
      where: {
        id: commentId
      }
    });
    comment.content = data.content;
    await getRepository(Comment).save(comment);
  }
}
