import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Root API endpoint',
    description: 'Returns a welcome message and API status.',
  })
  getHello() {
    return {
      message: 'Welcome to the School Management System API',
      version: '1.0',
      status: 'OK',
    };
  }
}
