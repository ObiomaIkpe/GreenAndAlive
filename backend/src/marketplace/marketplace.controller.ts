import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateCarbonCreditDto } from './dto/create-carbon-credit.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdateCarbonCreditDto } from './dto/update-carbon-credit.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('credits')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new carbon credit listing' })
  @ApiResponse({ status: 201, description: 'Carbon credit created successfully' })
  createCredit(@Body() createCarbonCreditDto: CreateCarbonCreditDto) {
    return this.marketplaceService.createCarbonCredit(createCarbonCreditDto);
  }

  @Get('credits')
  @ApiOperation({ summary: 'Get all carbon credits with optional filters' })
  @ApiResponse({ status: 200, description: 'Carbon credits retrieved successfully' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAllCredits(
    @Query('type') type?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('location') location?: string,
    @Query('verified') verified?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.findAllCredits({
      type,
      minPrice,
      maxPrice,
      location,
      verified,
      sortBy,
      sortOrder,
      limit,
      offset,
    });
  }

  @Get('credits/:id')
  @ApiOperation({ summary: 'Get a specific carbon credit' })
  @ApiResponse({ status: 200, description: 'Carbon credit retrieved successfully' })
  findCredit(@Param('id') id: string) {
    return this.marketplaceService.findCreditById(id);
  }

  @Patch('credits/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a carbon credit listing' })
  @ApiResponse({ status: 200, description: 'Carbon credit updated successfully' })
  updateCredit(@Param('id') id: string, @Body() updateCarbonCreditDto: UpdateCarbonCreditDto) {
    return this.marketplaceService.updateCarbonCredit(id, updateCarbonCreditDto);
  }

  @Post('purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase carbon credits' })
  @ApiResponse({ status: 201, description: 'Purchase completed successfully' })
  purchaseCredit(@Request() req, @Body() createPurchaseDto: CreatePurchaseDto) {
    return this.marketplaceService.purchaseCredit(req.user.id, createPurchaseDto);
  }

  @Get('purchases')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user purchase history' })
  @ApiResponse({ status: 200, description: 'Purchase history retrieved successfully' })
  getUserPurchases(@Request() req) {
    return this.marketplaceService.getUserPurchases(req.user.id);
  }

  @Get('purchases/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific purchase' })
  @ApiResponse({ status: 200, description: 'Purchase retrieved successfully' })
  getPurchase(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.getPurchaseById(id, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace statistics' })
  @ApiResponse({ status: 200, description: 'Marketplace stats retrieved successfully' })
  getMarketStats() {
    return this.marketplaceService.getMarketStats();
  }
}