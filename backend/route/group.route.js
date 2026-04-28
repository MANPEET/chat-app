import express from "express";
import { protectedRoute } from "../middleware/protectedRoute.js"
import { addGroup, getGroupMessage, getGroups, sendGroupMessage } from "../controllers/group.controller.js";

const groupRouter = express.Router();

groupRouter.post("/add-group",protectedRoute,addGroup)
groupRouter.get("/get-group",protectedRoute,getGroups)
groupRouter.post("/send-group-message/:id",protectedRoute,sendGroupMessage)
groupRouter.get("/get-group-message/:id",protectedRoute,getGroupMessage)

export default groupRouter