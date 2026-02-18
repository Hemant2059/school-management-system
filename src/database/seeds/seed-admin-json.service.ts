import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Province } from '../entities/province.entity';
import { District } from '../entities/district.entity';
import { LocalBody } from '../entities/local-body.entity';
import { Ward } from '../entities/ward.entity';

@Injectable()
export class SeedAdminJsonService {
  constructor(
    @InjectRepository(Province)
    private provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private districtRepo: Repository<District>,
    @InjectRepository(LocalBody)
    private localBodyRepo: Repository<LocalBody>,
    @InjectRepository(Ward)
    private wardRepo: Repository<Ward>,
  ) {}

  async seed() {
    let jsonPath = path.join(process.cwd(), 'src/database/seeds/final.json');
    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(__dirname, 'final.json');
    }

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`final.json not found at ${jsonPath}`);
    }

    console.log(`📂 Seeding from ${jsonPath}...`);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    for (const provinceId in data) {
      const provinceData = data[provinceId];

      // Seed Province
      await this.provinceRepo.upsert({ id: parseInt(provinceId) }, ['id']);

      for (const districtId in provinceData) {
        if (districtId === 'name') continue;
        const districtData = provinceData[districtId];

        // Seed District
        await this.districtRepo.upsert(
          {
            id: parseInt(districtId),
            provinceId: parseInt(provinceId),
          },
          ['id'],
        );

        const vdcMuns = districtData.vdc_mun;
        for (const localBodyId in vdcMuns) {
          const localBodyData = vdcMuns[localBodyId];

          // Seed LocalBody
          await this.localBodyRepo.upsert(
            {
              id: parseInt(localBodyId),
              districtId: parseInt(districtId),
              type: localBodyData.name.includes('गाउँपालिका')
                ? 'RURAL_MUNICIPALITY'
                : 'MUNICIPALITY',
            },
            ['id'],
          );

          const wards = localBodyData.wards;
          for (const wardNumber of wards) {
            // Seed Ward
            await this.wardRepo.upsert(
              {
                localBodyId: parseInt(localBodyId),
                wardNumber: wardNumber,
              },
              ['localBodyId', 'wardNumber'],
            );
          }
        }
      }
    }
    console.log('✅ Administrative data seeding complete from JSON');
  }
}
