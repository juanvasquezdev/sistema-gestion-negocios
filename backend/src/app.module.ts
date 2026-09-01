import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ClienteModule } from './cliente/cliente.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { ProductoModule } from './producto/producto.module';
import { VentaModule } from './venta/venta.module';
import { DeudaModule } from './deuda/deuda.module';
import { ResumenModule } from './resumen/resumen.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    CategoriaModule,
    ClienteModule,
    ProveedorModule,
    ProductoModule,
    VentaModule,
    DeudaModule,
    ResumenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
