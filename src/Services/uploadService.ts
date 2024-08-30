import dotenv from 'dotenv';
dotenv.config();
import { saveUploadData } from '../Repositories/uploadRepositories';
import { checkCustomerDataInRepository } from "../Repositories/uploadRepositories";
import { confirmDataMeasure } from "../Repositories/uploadRepositories";
import { consultDataClientMeasure } from "../Repositories/uploadRepositories";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY is not defined in environment variables');
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
interface FileData {
  inlineData: {
    data: string;
    mimeType: string;
  };
}
interface ProcessImageResponse {
  status: number;
  data?: {
    message: string;
    image_url: string;
    measure_value: string;
    measure_uuid: string;
  };
  error?: {
    error_code: string;
    error_description: string;
  };
}
export const checkCustomerData = async (
  customerCode: string,
  monthYear : string,
  measureType: "WATER" | "GAS"
): Promise<boolean> => {

  return await checkCustomerDataInRepository(
    customerCode,
    monthYear  ,
    measureType
  );
};
export const GeneratingMeasurementValueAndSavingData = async (newFilePath: string, customer_code : string, measure_datetime: string, measure_type: string): Promise<ProcessImageResponse> => {
  try {
    function fileToGenerativePart(filePath: string, mimeType: string): FileData {
      return {
        inlineData: {
          data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
          mimeType,
        },
      };
    }
    const prompt = "identify the number on the meter and bring it to me as an integer only number";
    const imagePart = fileToGenerativePart(newFilePath, "image/jpeg");
    const result = await model.generateContent([prompt, imagePart]);
    const generatedText = result.response.text();
    const measureUuid = uuidv4();
    console.log("measureUuid",measureUuid)
    const imageUrl = `https://example.com/uploads/${measureUuid}.png`;
    await saveUploadData(imageUrl, generatedText, measureUuid,customer_code, measure_datetime, measure_type);
    return {
      status: 200,
      data: {
        message: "Operação realizada com sucesso  ", 
        image_url: imageUrl,
        measure_value: generatedText,
        measure_uuid: measureUuid,
      },
    };
  } catch (error) {
    return {
      status: 400,
      error: {
        error_code: "INVALID_DATA",
        error_description: `Os dados fornecidos no corpo da requisição são inválidos ${(error as Error).message}`,
      },
    };
  }
};
export const ConfirmingMeasurements = async (measure_uuid: string, confirmed_value: number) => {
  try {
    const resultDataBase = await confirmDataMeasure(measure_uuid, confirmed_value);
    return resultDataBase;
  } catch (error) {
    console.error('Erro no serviço de confirmação de dados:', error);
    return {
      status: 500,
      body: {
        error_code: "SERVICE_ERROR",
        error_description: "Erro ao processar a confirmação dos dados."
      }
    };
  }
};
export const getFilterByClient = async (clientCode: string, measure_type: string) => {
  try {
    const dataClient = await consultDataClientMeasure(clientCode, measure_type);
    return dataClient;
  } catch (error) {
    console.error('Erro no serviço:', error);
    return {
      status: 500,
      body: {
        error_code: 'SERVICE_ERROR',
        error_description: 'Erro ao processar a solicitação no serviço.'
      }
    };
  }
};