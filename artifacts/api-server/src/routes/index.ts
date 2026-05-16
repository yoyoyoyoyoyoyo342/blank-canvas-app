import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import briefingsRouter from "./briefings.js";
import weatherRouter from "./weather.js";
import calendarRouter from "./calendar.js";
import gmailRouter from "./gmail.js";
import caldavRouter from "./caldav.js";
import aulaRouter from "./aula.js";
import schedulesRouter from "./schedules.js";
import spotifyRouter from "./spotify.js";
import chatRouter from "./chat.js";
import settingsRouter from "./settings.js";
import geocodeRouter from "./geocode.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(briefingsRouter);
router.use(weatherRouter);
router.use(calendarRouter);
router.use(gmailRouter);
router.use(caldavRouter);
router.use(aulaRouter);
router.use(schedulesRouter);
router.use(spotifyRouter);
router.use(chatRouter);
router.use(settingsRouter);
router.use(geocodeRouter);

export default router;
