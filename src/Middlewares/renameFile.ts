import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

export const renameFileMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "Nenhuma imagem foi enviada.",
    });
  }
  const oldPath = req.file.path;
  const newFileName = `processed-${path.basename(oldPath)}`;
  const newPath = path.join(path.dirname(oldPath), newFileName);
  try {
    await new Promise<void>((resolve, reject) => {
      fs.rename(oldPath, newPath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    req.file.path = newPath; 
    next();
  } catch (err) {
    return res.status(500).json({
      error_code: "FILE_RENAME_ERROR",
      error_description: "Erro ao renomear a imagem.",
    });
  }
};
