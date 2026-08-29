import { Module } from '@nestjs/common';
import { DeudaController } from './deuda.controller';
import { DeudaService } from './deuda.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeudaController],
  providers: [DeudaService],
})
export class DeudaModule {}
