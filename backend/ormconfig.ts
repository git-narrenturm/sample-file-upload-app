import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "@entities/User";
import { File } from "@entities/File";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.MYSQL_HOST,
  port: +(process.env.MYSQL_PORT || 3306),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: [User, File],
  synchronize: true,
  logging: false,
});

/**
 * инициализация БД
 */
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("DataSource initialized");
  } catch (err) {
    console.error("Database initialization failed", err);
    process.exit(1);
  }
};
