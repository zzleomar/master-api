import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { Master } from '../auth/utils/decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Master()
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createInsuranceDto: CreateInsuranceDto) {
    return this.insurancesService.create(createInsuranceDto);
  }

  @Get()
  findAll() {
    return this.insurancesService.findAll();
  }

  @Master()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInsuranceDto: UpdateInsuranceDto,
  ) {
    return this.insurancesService.update(id, updateInsuranceDto);
  }
}
