import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
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

  // Endpoint to download PDF report
  @Get(':id/pdf')
  async getReportPdf(@Param('id') id: string, @Req() req, @Res() res) {
    const jwtToken = req.cookies?.['jwt'];
    if (!jwtToken) {
      return res.status(401).json({ message: 'Unauthorized: Missing JWT cookie' });
    }

    try {
      const pdfBuffer = await this.reportService.generatePdf(id, jwtToken);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seo-report-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (error) {
      console.error('[ReportController] PDF generation error:', error);
      res.status(500).json({ message: 'Failed to generate PDF report' });
    }
  }

  // Endpoint to get a specific report by its scan ID
  @Get(':id')
  getReportById(@Param('id') id: string, @Req() req) {
    return this.reportService.getReportById(id, req.user);
  }
}
