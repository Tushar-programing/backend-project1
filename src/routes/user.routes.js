import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { changeCurrentPassword, forgotPassword, login, logoutUser, register} from "../controllers/user.controllers.js";
// import 
 
const router = Router();

router.route("/register").post(register)

router.route("/login").post(login)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/forgotPassword").post(verifyJWT, forgotPassword);

router.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword);



export default router;