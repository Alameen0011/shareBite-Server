import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ErrorResponse } from "../interfaces/error";



// Global Error Handler Middleware
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
    console.error(err);
  
    const errorResponse: ErrorResponse = {
      success: false,
      message: "Internal Server Error",
    };
  
    if (err instanceof ZodError) {
      errorResponse.message = "Validation failed";
      errorResponse.errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
       res.status(400).json(errorResponse)
       return;
    }
  
    if (err.code === 11000) {
      errorResponse.message = "Duplicate key error";
      errorResponse.errors = err.keyValue;
      res.status(400).json(errorResponse)
      return;
    }
  
    if (err.status) {
      errorResponse.message = err.message || "An error occurred";
      res.status(err.status).json(errorResponse)
      return ;
    }
  
    res.status(500).json(errorResponse);
  };
export default errorHandler