import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado.';

    switch (exception.code) {
      case 'P2002': {
        // Violación de restricción @@unique (ej. documento duplicado)
        const campos = (exception.meta?.target as string[])?.join(', ') ?? 'un campo';
        status = HttpStatus.CONFLICT;
        message = `Ya existe un registro con ese valor en: ${campos}.`;
        break;
      }
      case 'P2003': {
        // Violación de llave foránea: intentando borrar/modificar algo referenciado
        status = HttpStatus.CONFLICT;
        message =
          'No se puede completar la acción porque este registro está relacionado con otros datos (ventas, deudas u otros registros dependientes).';
        break;
      }
      case 'P2025': {
        // Registro no encontrado (ej. update/delete sobre un id que ya no existe)
        status = HttpStatus.NOT_FOUND;
        message = 'El registro que intentas modificar no existe.';
        break;
      }
      default: {
        message = 'Ocurrió un error al procesar la solicitud.';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
