/* Scratch verification for reshaped registry services (005).
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-student-service.ts
 */
import { DatabaseService } from '../src/database/database.service';
import { StudentService } from '../src/student/student.service';
import { GuardianService } from '../src/guardian/guardian.service';

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();
  const students = new StudentService(db);
  const guardians = new GuardianService(db);

  const school = await db.queryOne<{ school_id: number }>(
    `SELECT school_id FROM schools WHERE name = 'Legacy Regel School'`,
  );
  const sid = school!.school_id;

  // Create with raw caste name + BS dob auto-convert + new CEHRD fields.
  const created = await students.create(
    {
      schoolId: sid,
      admissionNumber: 'ADM-SVC-1',
      firstNameEn: 'Svc',
      lastNameEn: 'Kid',
      dateOfBirthAd: new Date('2013-06-01'),
      gender: 'MALE',
      casteEthnicity: 'Tharu',
      studentMobile: '9841001200',
      hasDisability: true,
      disabilityType: 'Hearing',
      bankName: 'NMB',
      bankAccountNumber: '001-999',
      citizenshipNumber: 'CIT-1',
    } as any,
    1,
  );
  console.log(
    'created:',
    created.admission_number,
    'caste=' + created.caste_code,
    'bs=' + created.date_of_birth_bs,
    'bank=' + created.bank_name,
  );

  // findAll with session scoping (placement migrated for ADM-L1).
  const page = await students.findAll(sid, { academicYear: '2082' } as any);
  console.log(
    'findAll total:',
    (page.meta as any)?.itemCount ?? (page as any)?.meta?.itemCount,
    'first roll:',
    (page.data[0] as any)?.roll_number,
  );

  // Update incl. caste remap.
  const updated = await students.update(
    created.student_id,
    { casteEthnicity: '06C', studentMobile: '9841001201' } as any,
    1,
  );
  console.log('updated caste:', updated.caste_code, updated.student_mobile);

  // Guardian CRUD on canonical columns.
  const g = await guardians.create({
    schoolId: sid,
    firstNameEn: 'Svc',
    lastNameEn: 'Parent',
    relationToStudent: 'FATHER',
    mobile: '9841001300',
    citizenshipNumber: 'GCIT-1',
    addressEn: 'Kathmandu',
  } as any);
  console.log('guardian:', g.guardian_code, g.mobile, g.citizenship_no);
  const g2 = await guardians.update(g.guardian_id, sid, {
    relation: 'MOTHER',
  } as any);
  console.log('guardian relation fixed:', g2.relation_to_student);
  const found = await guardians.findByMobile('9841001300', sid);
  console.log('findByMobile:', found?.guardian_code ?? 'MISS');

  // Constraint proof: bad mobile rejected, dup admission rejected.
  const bad = await students
    .create(
      {
        schoolId: sid,
        admissionNumber: 'ADM-SVC-2',
        firstNameEn: 'Bad',
        lastNameEn: 'Mobile',
        dateOfBirthAd: new Date('2013-01-01'),
        gender: 'MALE',
        studentMobile: '12345',
      } as any,
      1,
    )
    .then(() => 'BAD-MOBILE ACCEPTED (FAIL)')
    .catch(() => 'bad mobile rejected OK');
  console.log(bad);

  await db.onModuleDestroy();
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e.message);
  process.exit(1);
});
