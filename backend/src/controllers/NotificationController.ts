import { Router } from "express";
import { findMyNotifications } from "../services/NotificationService";

const notificationRouter = Router();

notificationRouter.get("/my-notifications", async (req, res) => {
  const userId = Number(req.userId);
  try {
    const notifications = await findMyNotifications(userId);
    return res.status(200).send(notifications);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Couldn't fetch notifications!");
  }
});

export default notificationRouter;
