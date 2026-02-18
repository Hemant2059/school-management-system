import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('provinces')
export class Province {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'name_np' })
  nameNp: string;
}
