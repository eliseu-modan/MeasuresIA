import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const checkCustomerDataInRepository = async (
  customerCode: string,
  monthYear : string,
  measureType: "WATER" | "GAS"
): Promise<boolean> => {
  const existingData = await prisma.imageProcessing.findFirst({
    where: {
      customer_code: customerCode,
      measure_datetime: monthYear,
      measure_type: measureType,
    },
  });
  return !!existingData;
};
export const saveUploadData = async (
  imageUrl: string,
  generatedText: string,
  measureUuid: string,
  customer_code : string,
  measure_datetime :string,
  measure_type : string
) => {
const hasConfirmed = true
  const measureValueInt = parseInt(generatedText, 10);
  if (isNaN(measureValueInt)) {
    throw new Error("measureValue não é um número válido");
  }
  return prisma.imageProcessing.create({
    data: {
      image_url: imageUrl,
      measure_value: measureValueInt, 
      measure_uuid: measureUuid,
      customer_code: customer_code, 
      measure_datetime: measure_datetime, 
      measure_type: measure_type, 
      has_confirmed: hasConfirmed
    },
  });
};
export const confirmDataMeasure = async (measure_uuid: string, confirmed_value: number) => {
  try {
    if (!measure_uuid || typeof confirmed_value !== 'number') {
      return {
        status: 400,
        body: {
          message: "Os dados fornecidos no corpo da requisição são inválidos."
        }
      };
    }
    const measure = await prisma.imageProcessing.findUnique({
      where: { measure_uuid: measure_uuid }
    });

    if (!measure) {
      return {
        status: 404,
        body: {
          message: "Leitura não encontrada"
        }
      };
    }
    if (measure.measure_value === confirmed_value) {
      if (measure.has_confirmed) {
        return {
          status: 409,
          body: {
            success: false,
            message: "Leitura já confirmada."
          }
        };
      } else {
        await prisma.imageProcessing.update({
          where: { measure_uuid },
          data: { has_confirmed: true }
        });
      }
    } else {
      await prisma.imageProcessing.update({
        where: { measure_uuid },
        data: { measure_value: confirmed_value, has_confirmed: true }
      });
    }
    return {
      status: 200,
      body: {
        success: true,
        message: "Operação realizada com sucesso"
      }
    };
  } catch (error) {
    console.error('Erro interno:', error);
    return {
      status: 500,
      body: {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Ocorreu um erro ao processar a requisição.'
      }
    };
  }
};
export const consultDataClientMeasure = async (clientCode: string, measure_type?: string) => {
  try {
    const queryCondition: any = {
      customer_code: clientCode,
    };
    if (measure_type) {
      if (measure_type !== 'WATER' && measure_type !== 'GAS') {
        return {
          status: 400,
          body: {
            error_code: 'INVALID_TYPE',
            error_description: 'Tipo de medição não permitida'
          }
        };
      }
      queryCondition.measure_type = measure_type;
    }
    const measures = await prisma.imageProcessing.findMany({
      where: queryCondition
    });
    if (measures.length === 0) {
      return {
        status: 404,
        body: {
          error_code: 'MEASURES_NOT_FOUND',
          error_description: 'Nenhuma leitura encontrada'
        }
      };
    }
    return {
      status: 200,
      body: {
        customer_code: clientCode,
        measures: measures.map(measure => ({
          measure_uuid: measure.measure_uuid,
          measure_datetime: measure.measure_datetime,
          measure_type: measure.measure_type,
          has_confirmed: measure.has_confirmed,
          image_url: measure.image_url
        }))
      }
    };
  } catch (error) {
    console.error('Erro interno:', error);
    return {
      status: 500,
      body: {
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Ocorreu um erro ao processar a requisição.'
      }
    };
  }
}
