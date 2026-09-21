import { Lang } from "../shared/middlewares/lang.middleware";

export {};

declare global {
    namespace Express {
        interface Request {
            user: {
                userId: string;
                role: string;
            };
            lang: Lang;
        }
    }
}