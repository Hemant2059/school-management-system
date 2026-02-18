import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AcademicClass } from '../src/academic-class/entities/academic-class.entity';
import { School } from '../src/school/entities/school.entity'; // ✅ Critical: Must include School entity

dotenv.config();

const nepalClasses = [
  // PRIMARY (Grade 1-5)
  { className: 'Grade 1', classCode: 'G1', classOrder: 1, level: 'PRIMARY', min: 5, max: 7 },
  { className: 'Grade 2', classCode: 'G2', classOrder: 2, level: 'PRIMARY', min: 6, max: 8 },
  { className: 'Grade 3', classCode: 'G3', classOrder: 3, level: 'PRIMARY', min: 7, max: 9 },
  { className: 'Grade 4', classCode: 'G4', classOrder: 4, level: 'PRIMARY', min: 8, max: 10 },
  { className: 'Grade 5', classCode: 'G5', classOrder: 5, level: 'PRIMARY', min: 9, max: 11 },
  
  // LOWER_SECONDARY (Grade 6-8)
  { className: 'Grade 6', classCode: 'G6', classOrder: 6, level: 'LOWER_SECONDARY', min: 10, max: 12 },
  { className: 'Grade 7', classCode: 'G7', classOrder: 7, level: 'LOWER_SECONDARY', min: 11, max: 13 },
  { className: 'Grade 8', classCode: 'G8', classOrder: 8, level: 'LOWER_SECONDARY', min: 12, max: 14 },
  
  // SECONDARY (Grade 9-10)
  { className: 'Grade 9', classCode: 'G9', classOrder: 9, level: 'SECONDARY', min: 13, max: 15 },
  { className: 'Grade 10', classCode: 'G10', classOrder: 10, level: 'SECONDARY', min: 14, max: 16 },
  
  // HIGHER_SECONDARY (Grade 11-12)
  { className: 'Grade 11', classCode: 'G11', classOrder: 11, level: 'HIGHER_SECONDARY', min: 16, max: 17 },
  { className: 'Grade 12', classCode: 'G12', classOrder: 12, level: 'HIGHER_SECONDARY', min: 17, max: 18 },
];

async function seed() {
  // ✅ FIXED: Include BOTH AcademicClass AND School entities
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'sms_nepal',
    entities: [AcademicClass, School], // ✅ Critical fix
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✅ Database connected');

  // Get school ID (assuming school ID 1 exists)
  const schoolRepository = dataSource.getRepository(School);
  const school = await schoolRepository.findOne({ where: { schoolId: 1 } });
  
  if (!school) {
    console.error('❌ No school found with ID 1. Please create a school first!');
    console.log('\nRun this command to create a school:');
    console.log('curl -X POST http://localhost:3000/schools -H "Content-Type: application/json" -d \'{"schoolName":"Demo School","schoolType":"DAY","ownershipType":"PRIVATE","mobile":"9841234567","email":"demo@sms.edu.np"}\'');
    await dataSource.destroy();
    process.exit(1);
  }

  const academicClassRepository = dataSource.getRepository(AcademicClass);
  
  for (const cls of nepalClasses) {
    // Check if class already exists
    const existing = await academicClassRepository.findOne({ 
      where: { classCode: cls.classCode, schoolId: school.schoolId } 
    });
    
    if (!existing) {
      const academicClass = academicClassRepository.create({
        schoolId: school.schoolId,
        className: cls.className,
        classCode: cls.classCode,
        classOrder: cls.classOrder,
        educationLevel: cls.level,
        minAge: cls.min,
        maxAge: cls.max,
        isActive: true,
      });
      
      await academicClassRepository.save(academicClass);
      console.log(`✅ Created: ${cls.className}`);
    } else {
      console.log(`⏭️  Skipped (exists): ${cls.className}`);
    }
  }

  await dataSource.destroy();
  console.log('\n✅ Nepal education structure seeded successfully!');
  console.log(`📚 Total classes created: ${nepalClasses.length}`);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
});
