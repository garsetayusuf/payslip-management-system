import { Logger, LoggerService } from '@nestjs/common';
import ansis from 'ansis';

export class CustomLogger extends Logger implements LoggerService {
  logSequelize(message: string) {
    super.log(ansis.hex('#b165d0')(message));
  }

  logRequest(message: string) {
    super.log(ansis.blueBright(message));
  }

  logResponse(message: string) {
    super.log(ansis.greenBright(message));
  }
}
