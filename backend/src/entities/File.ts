import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "@entities/User";

@Entity()
export class File {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy!: User;

  @Column({ type: "varchar", length: 100})
  createdById!: string;

  @UpdateDateColumn({ type: "timestamp" })
  modifiedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "modifiedById" })
  modifiedBy!: User;

  @Column({ type: "varchar", length: 100})
  modifiedById!: string;

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
