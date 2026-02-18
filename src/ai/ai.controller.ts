import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get smart suggestions',
    description:
      'Returns rule-based suggestions for the school: overdue fees, free-seat quota, compliance reminders. No external AI required.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    required: true,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Suggestions with BS dates' })
  getSuggestions(@Query('schoolId', ParseIntPipe) schoolId: number) {
    return this.aiService.getSuggestions(schoolId);
  }

  @Get('insights/dashboard')
  @ApiOperation({
    summary: 'Dashboard insights',
    description:
      'Summary stats and suggestions for the school dashboard. Includes total students, free-seat %, overdue fee count, and actionable suggestions.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    required: true,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Dashboard insight with BS dates' })
  getDashboardInsights(@Query('schoolId', ParseIntPipe) schoolId: number) {
    return this.aiService.getDashboardInsights(schoolId);
  }

  @Get('help')
  @Public()
  @ApiOperation({
    summary: 'System help / FAQ',
    description:
      'Get help on how to use the system. Optional query to search FAQ. Returns answers and full FAQ list. Dates in BS.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Optional question (e.g. "how to add student")',
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Help answer and FAQ' })
  getHelp(@Query('q') q?: string) {
    return this.aiService.getHelp(q);
  }
}
