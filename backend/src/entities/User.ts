import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Session } from "@entities/Session";

@Entity()
export class User {
  @PrimaryColumn({ type: "varchar", length: 255 })
  id!: string;

  @Column({ type: "varchar", length: 255, select: false })
  password!: string;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
