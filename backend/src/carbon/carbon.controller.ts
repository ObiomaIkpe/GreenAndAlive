import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CarbonService } from './carbon.service';
import { CreateCarbonFootprintDto } from './dto/create-carbon-footprint.dto';
import { UpdateCarbonFootprintDto } from './dto/update-carbon-footprint.dto';

@ApiTags('carbon')
@Controller('carbon')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CarbonController {
  constructor(private readonly carbonService: CarbonService) {}

  @Post('footprint')
  @ApiOperation({ summary: 'Create a new carbon footprint calculation' })
  @ApiResponse({ status: 201, description: 'Carbon footprint created successfully' })
  create(@Request() req, @Body() createCarbonFootprintDto: CreateCarbonFootprintDto) {
    return this.carbonService.create(req.user.id, createCarbonFootprintDto);
  }

  @Get('footprint')
  @ApiOperation({ summary: 'Get all carbon footprint records for user' })
  @ApiResponse({ status: 200, description: 'Carbon footprint records retrieved' })
  findAll(@Request() req) {
    return this.carbonService.findAll(req.user.id);
  }

  @Get('footprint/latest')
  @ApiOperation({ summary: 'Get latest carbon footprint calculation' })
  @ApiResponse({ status: 200, description: 'Latest carbon footprint retrieved' })
  getLatest(@Request() req) {
    return this.carbonService.getLatest(req.user.id);
  }

  @Get('footprint/trend')
  @ApiOperation({ summary: 'Get monthly carbon footprint trend' })
  @ApiResponse({ status: 200, description: 'Carbon footprint trend retrieved' })
  getTrend(@Request() req, @Query('months') months?: number) {
    return this.carbonService.getMonthlyTrend(req.user.id, months);
  }

  @Get('footprint/:id')
  @ApiOperation({ summary: 'Get a specific carbon footprint record' })
  @ApiResponse({ status: 200, description: 'Carbon footprint record retrieved' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.carbonService.findOne(id, req.user.id);
  }

  @Patch('footprint/:id')
  @ApiOperation({ summary: 'Update a carbon footprint record' })
  @ApiResponse({ status: 200, description: 'Carbon footprint updated successfully' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCarbonFootprintDto: UpdateCarbonFootprintDto,
  ) {
    return this.carbonService.update(id, req.user.id, updateCarbonFootprintDto);
  }

  @Delete('footprint/:id')
  @ApiOperation({ summary: 'Delete a carbon footprint record' })
  @ApiResponse({ status: 200, description: 'Carbon footprint deleted successfully' })
  remove(@Request() req, @Param('id') id: string) {
    return this.carbonService.remove(id, req.user.id);
  }
}