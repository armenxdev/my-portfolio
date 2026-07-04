import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { CustomTypeORMLogger } from "../utils/typeorm-logger";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("💥 DATABASE_URL environment variable is missing in your .env file!");
}

const isProduction = process.env.NODE_ENV === "production";
const caCertPath = path.join(__dirname, "..", "..", "certificates", "ca.pem");

const hasCaCert = fs.existsSync(caCertPath);

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL!,
    synchronize: !isProduction,

    logger: new CustomTypeORMLogger(),
    logging: ["error"],

    entities: [
        isProduction
            ? __dirname + "/../entities/*.js"
            : __dirname + "/../entities/*.ts"
    ],
    migrations: [],
    subscribers: [],

    // 🛠️ Ուղղված և ապահով SSL կարգավորում
    ssl: hasCaCert
        ? {
            ca: fs.readFileSync(caCertPath).toString(),
            rejectUnauthorized: true, // Սա թույլ չի տա self-signed սխալը, եթե ճիշտ CA-ն տրված է
        }
        : isProduction
            ? { rejectUnauthorized: true }
            : { rejectUnauthorized: false }, // Ֆեյլբեք, եթե լոկալում ֆայլը չկա
});