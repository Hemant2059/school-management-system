import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import {
  CreateTCDto,
  CreateBonafideDto,
  CreateCharacterDto,
} from './dto/certificate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('tc')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Generate Transfer Certificate (TC)',
    description: `Generate Transfer Certificate for a student who is leaving the school.

**Features:**
- Student academic history
- Character assessment
- Fee clearance status
- Unique TC number
- School seal and signature

**Note:** TC can only be generated after all fees are cleared.`,
  })
  @ApiBody({
    description: 'TC generation data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        schoolId: { type: 'number', example: 1 },
        tcDate: { type: 'string', example: '2081-04-01' },
        reason: { type: 'string', example: 'Transfer to another school' },
        character: { type: 'string', example: 'GOOD' },
        conduct: { type: 'string', example: 'GOOD' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'TC generated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        tcNumber: { type: 'string', example: 'TC-2024-0001' },
        studentName: { type: 'string', example: 'Ram Sharma' },
        message: { type: 'string', example: 'TC generated successfully' },
      },
    },
  })
  createTC(@Body() dto: CreateTCDto) {
    return this.certificateService.createTC(dto);
  }

  @Post('bonafide')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Generate Bonafide Certificate',
    description: `Generate Bonafide Certificate proving student enrollment.

**Features:**
- Student current enrollment status
- Class and section
- Academic year
- Unique certificate number
- Verification code`,
  })
  @ApiBody({
    description: 'Bonafide certificate data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        schoolId: { type: 'number', example: 1 },
        purpose: { type: 'string', example: 'Bank account opening' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bonafide certificate generated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        certificateNumber: { type: 'string', example: 'BF-2024-0001' },
        studentName: { type: 'string', example: 'Ram Sharma' },
        message: { type: 'string', example: 'Bonafide certificate generated' },
      },
    },
  })
  createBonafide(@Body() dto: CreateBonafideDto) {
    return this.certificateService.createBonafide(dto);
  }

  @Post('character')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Generate Character Certificate',
    description: `Generate Character Certificate for student conduct.

**Features:**
- Student personal details
- Character assessment
- Conduct rating
- Principal signature
- School seal`,
  })
  @ApiBody({
    description: 'Character certificate data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        schoolId: { type: 'number', example: 1 },
        character: { type: 'string', example: 'EXCELLENT' },
        conduct: { type: 'string', example: 'GOOD' },
        period: { type: 'string', example: '2080-2081' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Character certificate generated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        certificateNumber: { type: 'string', example: 'CC-2024-0001' },
        studentName: { type: 'string', example: 'Ram Sharma' },
        message: { type: 'string', example: 'Character certificate generated' },
      },
    },
  })
  createCharacter(@Body() dto: CreateCharacterDto) {
    return this.certificateService.createCharacter(dto);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Get All Certificates for Student',
    description: `Retrieve all certificates generated for a student.

**Query Parameters:**
- schoolId: Required for filtering

**Returns:**
- TC, Bonafide, Character certificates
- Certificate numbers
- Issue dates`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Student certificates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          type: { type: 'string', example: 'BONAFIDE' },
          certificateNumber: { type: 'string', example: 'BF-2024-0001' },
          issueDate: { type: 'string', example: '2081-04-15' },
        },
      },
    },
  })
  getStudentCertificates(
    @Param('studentId') studentId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.certificateService.getStudentCertificates(studentId, schoolId);
  }

  @Get(':certificateId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Get Certificate Details',
    description: `Retrieve certificate details by ID.

**Returns:**
- Certificate contents
- Verification status
- Student details`,
  })
  @ApiParam({
    name: 'certificateId',
    description: 'Certificate ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        type: { type: 'string', example: 'BONAFIDE' },
        certificateNumber: { type: 'string', example: 'BF-2024-0001' },
        studentName: { type: 'string', example: 'Ram Sharma' },
        issueDate: { type: 'string', example: '2081-04-15' },
        verificationStatus: { type: 'string', example: 'VERIFIED' },
      },
    },
  })
  getCertificate(
    @Param('certificateId') certificateId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.certificateService.getCertificateById(certificateId, schoolId);
  }

  @Post('bonafide/:certificateId/verify')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_VERIFY)
  @ApiOperation({
    summary: 'Verify Bonafide Certificate',
    description: `Verify a bonafide certificate as authentic.

**Process:**
1. Admin reviews the certificate
2. Marks as verified with signature
3. Updates verification status`,
  })
  @ApiParam({
    name: 'certificateId',
    description: 'Certificate ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    description: 'Verification data',
    schema: {
      type: 'object',
      properties: { verifiedBy: { type: 'number', example: 1 } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate verified',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Certificate verified successfully',
        },
        verificationStatus: { type: 'string', example: 'VERIFIED' },
      },
    },
  })
  verifyBonafide(
    @Param('certificateId') certificateId: number,
    @Body('verifiedBy') verifiedBy: number,
  ) {
    return this.certificateService.verifyBonafide(certificateId, verifiedBy);
  }

  @Post('character/:certificateId/verify')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_VERIFY)
  @ApiOperation({
    summary: 'Verify Character Certificate',
    description: `Verify a character certificate as authentic.

**Process:**
1. Admin reviews the certificate
2. Marks as verified with signature
3. Updates verification status`,
  })
  @ApiParam({
    name: 'certificateId',
    description: 'Certificate ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    description: 'Verification data',
    schema: {
      type: 'object',
      properties: { verifiedBy: { type: 'number', example: 1 } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate verified',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Certificate verified successfully',
        },
        verificationStatus: { type: 'string', example: 'VERIFIED' },
      },
    },
  })
  verifyCharacter(
    @Param('certificateId') certificateId: number,
    @Body('verifiedBy') verifiedBy: number,
  ) {
    return this.certificateService.verifyCharacter(certificateId, verifiedBy);
  }

  @Get('tc/list')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.CERTIFICATE_CREATE)
  @ApiOperation({
    summary: 'Get All TC Records for School',
    description: `Retrieve all TC records for a school.

**Query Parameters:**
- schoolId: Required for filtering
- academicYear: Optional filter by academic year

**Returns:**
- List of all transfer certificates
- Student details
- Issue dates`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year (optional)',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'TC list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          tcNumber: { type: 'string', example: 'TC-2024-0001' },
          studentName: { type: 'string', example: 'Ram Sharma' },
          class: { type: 'string', example: 'Grade 10' },
          tcDate: { type: 'string', example: '2081-04-01' },
          reason: { type: 'string', example: 'Transfer' },
        },
      },
    },
  })
  getTCsBySchool(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.certificateService.getTCsBySchool(schoolId, academicYear);
  }
}
