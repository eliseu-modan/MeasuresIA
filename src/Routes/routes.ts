import express, { Router } from "express";
import  uploads from "./uploadAndMeasureRoutes"; 


const routes: Router = express.Router();

routes.use("/uploads", uploads);

export default routes;
