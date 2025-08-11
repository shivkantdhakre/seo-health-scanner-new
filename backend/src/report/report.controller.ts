import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Secure all endpoints in this controller
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // Endpoint to start a new scan
  @Post('scan')
  initiateScan(@Body('url') url: string, @Req() req) {
    return this.reportService.initiateScan(url, req.user);
  }

  // Endpoint to get a user's scan history
  @Get('history')
  getScanHistory(@Req() req) {
    return this.reportService.getScanHistory(req.user);
  }

  // Endpoint to get a specific report by its scan ID
  @Get(':id')
  getReportById(@Param('id') id: string, @Req() req) {
    return this.reportService.getReportById(id, req.user);
  }
}