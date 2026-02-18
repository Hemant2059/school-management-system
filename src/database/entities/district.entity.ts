import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Province } from './province.entity';

@Entity('districts')
export class District {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'province_id' })
  provinceId: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'name_np' })
  nameNp: string;

  @ManyToOne(() => Province)
  @JoinColumn({ name: 'province_id' })
  province: Province;
}
