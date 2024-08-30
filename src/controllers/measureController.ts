import { Request, Response } from "express";
import { GeneratingMeasurementValueAndSavingData, checkCustomerData , ConfirmingMeasurements , getFilterByClient} from "../Services/uploadService";
import { getCurrentMonthYear } from '../utils/dateUtils'; 

interface dataClientInterface {
  image: string;
  customer_code: string;
  measure_datetime: string;
  measure_type: "WATER" | "GAS";
}

export const measurementVerificationProcess = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error_code: "INVALID_DATA",
      error_description: "Os dados fornecidos no corpo da requisição são inválidos",
    });
  }
  const dataClient: dataClientInterface = {
    image: req.body.base64Image,
    customer_code: req.body.customer_code,
    measure_datetime: req.body.measure_datetime,
    measure_type: req.body.measure_type,
  };
  const monthYear = getCurrentMonthYear(); 
  try {
    const dataExists = await checkCustomerData(
      dataClient.customer_code,
      monthYear, 
      dataClient.measure_type,
    );
    if (dataExists) {
      return res.status(409).json({
        error_code: "DATA_ALREADY_EXISTS",
        error_description: "Já existe uma leitura para este tipo no mês atual.",
      });
    }
    const serviceResponse = await GeneratingMeasurementValueAndSavingData(
      req.file.path,
      dataClient.customer_code,
      dataClient.measure_datetime,
      dataClient.measure_type
    );
    return res.status(serviceResponse.status).json(
      serviceResponse.status === 200
        ? { readData: serviceResponse, clientData: dataClient }
        : {
            error_code: serviceResponse.error?.error_code,
            error_description: serviceResponse.error?.error_description,
          }
    );
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error_code: "PROCESSING_ERROR",
      error_description: "Erro ao processar a imagem no serviço local.",
    });
  }
};

export const ConfirmMeasurementData = async (req: Request, res: Response) => {
  try {
    const { measure_uuid, confirmed_value } = req.body;
    const data = await ConfirmingMeasurements(measure_uuid, confirmed_value);
    return res.status(data.status).json(data.body);
  } catch (error) {
    console.error('Erro no controlador de confirmação de dados:', error);
    return res.status(500).json({
      error_code: "PROCESSING_ERROR",
      error_description: "Erro ao processar os dados no serviço local."
    });
  }
};
export const getMeasuresByClient = async (req: Request, res: Response) => {
  try {
    const { clientCode } = req.params;
    const { measure_type } = req.query;
    const measureType = typeof measure_type === 'string' ? measure_type : '';
    const getFilterClientData = await getFilterByClient(clientCode, measureType);
    return res.status(getFilterClientData.status).json(getFilterClientData.body);
  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter as medidas.',
    });
  }
};