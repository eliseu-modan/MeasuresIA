import express, { Router } from "express";
import { measurementVerificationProcess } from "../controllers/measureController";
import { ConfirmMeasurementData } from "../controllers/measureController";
import { getMeasuresByClient } from "../controllers/measureController";
import { renameFileMiddleware } from "../Middlewares/renameFile";
import { upload } from "../Middlewares/uploadImage"; 

const uploads: Router = express.Router();

uploads.post(
  "/images",
  upload, 
  renameFileMiddleware, 
  measurementVerificationProcess 
);
uploads.patch("/confirm", ConfirmMeasurementData)
uploads.get("/list/:clientCode",getMeasuresByClient )


export default uploads;
