import { Router, type IRouter } from "express";
import healthRouter from "./health";
import briefingsRouter from "./briefings";
import weatherRouter from "./weather";
import calendarRouter from "./calendar";
import gmailRouter from "./gmail";

const router: IRouter = Router();

router.use(healthRouter);
router.use(briefingsRouter);
router.use(weatherRouter);
router.use(calendarRouter);
router.use(gmailRouter);

export default router;
