import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { playerRouter } from "./player";
import { questsRouter } from "./quests";
import { achievementsRouter } from "./achievements";
import { journalRouter } from "./journal";
import { statsRouter } from "./stats";
import { bossBattlesRouter } from "./boss-battles";
import { inventoryRouter } from "./inventory";
import { dailyLoginRouter } from "./daily-login";
import { seasonsRouter } from "./seasons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playerRouter);
router.use(questsRouter);
router.use(achievementsRouter);
router.use(journalRouter);
router.use(statsRouter);
router.use(bossBattlesRouter);
router.use(inventoryRouter);
router.use(dailyLoginRouter);
router.use(seasonsRouter);

export default router;
