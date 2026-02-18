import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedAdminJsonService {
  constructor(private db: DatabaseService) {}

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

      await this.db.query(
        `INSERT INTO provinces (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
        [parseInt(provinceId)],
      );

      for (const districtId in provinceData) {
        if (districtId === 'name') continue;
        const districtData = provinceData[districtId];

        await this.db.query(
          `INSERT INTO districts (id, province_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
          [parseInt(districtId), parseInt(provinceId)],
        );

        const vdcMuns = districtData.vdc_mun;
        for (const localBodyId in vdcMuns) {
          const localBodyData = vdcMuns[localBodyId];

          await this.db.query(
            `INSERT INTO local_bodies (id, district_id, type) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
            [
              parseInt(localBodyId),
              parseInt(districtId),
              localBodyData.name.includes('गाउँपालिका')
                ? 'RURAL_MUNICIPALITY'
                : 'MUNICIPALITY',
            ],
          );

          const wards = localBodyData.wards;
          for (const wardNumber of wards) {
            await this.db.query(
              `INSERT INTO wards (local_body_id, ward_number) VALUES ($1, $2) ON CONFLICT (local_body_id, ward_number) DO NOTHING`,
              [parseInt(localBodyId), wardNumber],
            );
          }
        }
      }
    }
    console.log('✅ Administrative data seeding complete from JSON');
  }
}
