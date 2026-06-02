import { Module, Type, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { LoopModule } from '../loop/loop.module';
import { EspController } from './esp.controller';
import { KitOAuthController } from './kit-oauth.controller';
import { EspConnectionService } from './esp-connection.service';
import { EspAdapterFactory } from './esp-adapter.factory';
import { SimulatorService } from './adapters/simulator/simulator.service';
import { SimulatorGuard } from './adapters/simulator/simulator.guard';
import { SimulatorController } from './adapters/simulator/simulator.controller';

/**
 * The simulator controller is only registered outside production (and only when
 * ENABLE_SIMULATOR=true), so its routes do not exist on a production server.
 */
function resolveControllers(): Type<unknown>[] {
  const controllers: Type<unknown>[] = [EspController, KitOAuthController];
  const isProduction = process.env.NODE_ENV === 'production';
  const simulatorEnabled = process.env.ENABLE_SIMULATOR === 'true';
  if (!isProduction && simulatorEnabled) {
    controllers.push(SimulatorController);
  }
  return controllers;
}

@Module({
  imports: [DatabaseModule, forwardRef(() => LoopModule)],
  controllers: resolveControllers(),
  providers: [EspConnectionService, EspAdapterFactory, SimulatorService, SimulatorGuard],
  exports: [EspConnectionService, EspAdapterFactory],
})
export class EspModule {}
