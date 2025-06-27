import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggerService } from './services/logger.service';
import { ValidationService } from './services/validation.service';
import { UtilsService } from './services/utils.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [LoggerService, ValidationService, UtilsService],
  exports: [LoggerService, ValidationService, UtilsService, HttpModule],
})
export class CommonModule {}