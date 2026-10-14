/* Identity-numbers verification (012): citizenship/NIN optional (under-16),
 * full set for 16+, guardian NIN, late NIN update, duplicate rejected.
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-identity-numbers.ts
 */
import { DatabaseService } from '../src/database/database.service';
import { StudentService } from '../src/student/student.service';
import { GuardianService } from '../src/guardian/guardian.service';

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();
  const students = new StudentService(db);
  const guardians = new GuardianService(db);
  const tag = Date.now().toString(36);
  const s = await db.queryOne<any>(
    `INSERT INTO schools (name) VALUES ('ID School ' || $1) RETURNING school_id`,
    [tag],
  );
  const sid = s.school_id;

  const kid = await students.create(
    {
      schoolId: sid,
      admissionNumber: `ADM-K1-${tag}`,
      firstNameEn: 'Kid',
      lastNameEn: 'Junior',
      dateOfBirthAd: new Date('2018-05-01'),
      gender: 'MALE',
      birthCertificateNumber: `BC-2018-${tag}`,
    } as any,
    1,
  );
  console.log(
    'under-16 no-IDs ok:',
    !!kid.student_id,
    '| citizen:',
    kid.citizenship_number,
    '| nin:',
    kid.nin,
    '| birthcert:',
    kid.birth_certificate_number,
  );

  const teen = await students.create(
    {
      schoolId: sid,
      admissionNumber: `ADM-T1-${tag}`,
      firstNameEn: 'Teen',
      lastNameEn: 'Senior',
      dateOfBirthAd: new Date('2008-03-10'),
      gender: 'FEMALE',
      citizenshipNumber: `CIT-${tag}`,
      nin: `9${Date.now().toString().slice(-9)}`,
      birthCertificateNumber: `BC-2008-${tag}`,
    } as any,
    1,
  );
  console.log(
    '16+ full IDs ok:',
    !!teen.student_id,
    '| citizen:',
    teen.citizenship_number,
    '| nin:',
    teen.nin,
  );

  const g = await guardians.create({
    schoolId: sid,
    firstNameEn: 'Par',
    lastNameEn: 'Ent',
    relationToStudent: 'FATHER',
    mobile: '9841001701',
    citizenshipNumber: `GCIT-${tag}`,
    nin: `1${Date.now().toString().slice(-9)}`,
  } as any);
  console.log(
    'guardian IDs ok:',
    g.guardian_code,
    '| citizen:',
    g.citizenship_no,
    '| nin:',
    g.nin,
  );

  const upd = await students.update(
    kid.student_id,
    { nin: `55${Date.now().toString().slice(-8)}` } as any,
    1,
  );
  console.log('late NIN update ok:', upd.nin?.startsWith('55'));

  const dup = await students
    .create(
      {
        schoolId: sid,
        admissionNumber: `ADM-T2-${tag}`,
        firstNameEn: 'Dup',
        lastNameEn: 'Kid',
        dateOfBirthAd: new Date('2008-01-01'),
        gender: 'MALE',
        nin: teen.nin,
      } as any,
      1,
    )
    .then(() => 'DUP ACCEPTED (BAD)')
    .catch(() => 'dup NIN rejected OK');
  console.log(dup);

  const nonull = await students.create(
    {
      schoolId: sid,
      admissionNumber: `ADM-K2-${tag}`,
      firstNameEn: 'No',
      lastNameEn: 'Id',
      dateOfBirthAd: new Date('2019-01-01'),
      gender: 'FEMALE',
    } as any,
    1,
  );
  console.log('second NULL-NIN student ok:', !!nonull.student_id);
  await db.onModuleDestroy();
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e.message);
  process.exit(1);
});
