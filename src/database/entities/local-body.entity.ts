import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { District } from './district.entity';

@Entity('local_bodies')
export class LocalBody {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'district_id' })
  districtId: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'type',
  })
  type: string; // Municipality, Rural Municipality, Sub-Metropolitan, Metropolitan

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'name_np' })
  nameNp: string;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'district_id' })
  district: District;
}
