import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@entities/User";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: "CASCADE" })
  user!: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
