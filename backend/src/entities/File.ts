import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class File {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  modifiedAt!: Date;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "varchar", length: 20 })
  extension!: string;

  @Column({ type: "varchar", length: 100 })
  mimeType!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column({ type: "longblob", select: false })
  data!: Buffer;
}
