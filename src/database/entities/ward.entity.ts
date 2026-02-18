import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LocalBody } from './local-body.entity';

@Entity('wards')
@Index(['localBodyId', 'wardNumber'], { unique: true })
export class Ward {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'local_body_id' })
  localBodyId: number;

  @Column({ name: 'ward_number' })
  wardNumber: number;

  @ManyToOne(() => LocalBody)
  @JoinColumn({ name: 'local_body_id' })
  localBody: LocalBody;
}
