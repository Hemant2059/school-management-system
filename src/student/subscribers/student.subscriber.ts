import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Student } from '../entities/student.entity';
import { EncryptionUtil } from '../../utils/encryption.util';

@EventSubscriber()
export class StudentSubscriber implements EntitySubscriberInterface<Student> {
  listenTo() {
    return Student;
  }

  beforeInsert(event: InsertEvent<Student>) {
    if (event.entity.citizenshipNumber) {
      event.entity.citizenshipNumber = EncryptionUtil.encrypt(
        event.entity.citizenshipNumber,
      );
    }
    if (event.entity.birthCertificateNumber) {
      event.entity.birthCertificateNumber = EncryptionUtil.encrypt(
        event.entity.birthCertificateNumber,
      );
    }
  }

  beforeUpdate(event: UpdateEvent<Student>) {
    if (
      event.entity &&
      event.entity.citizenshipNumber &&
      event.databaseEntity.citizenshipNumber !== event.entity.citizenshipNumber
    ) {
      event.entity.citizenshipNumber = EncryptionUtil.encrypt(
        event.entity.citizenshipNumber,
      );
    }
    if (
      event.entity &&
      event.entity.birthCertificateNumber &&
      event.databaseEntity.birthCertificateNumber !==
        event.entity.birthCertificateNumber
    ) {
      event.entity.birthCertificateNumber = EncryptionUtil.encrypt(
        event.entity.birthCertificateNumber,
      );
    }
  }

  afterLoad(entity: Student) {
    if (entity.citizenshipNumber) {
      entity.citizenshipNumber = EncryptionUtil.decrypt(
        entity.citizenshipNumber,
      );
    }
    if (entity.birthCertificateNumber) {
      entity.birthCertificateNumber = EncryptionUtil.decrypt(
        entity.birthCertificateNumber,
      );
    }
  }
}
