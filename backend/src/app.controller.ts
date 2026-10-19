import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Endpoint racine public (information). Le healthcheck Render est sur /healthz.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
