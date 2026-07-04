import type { Logger as TypeORMLogger, QueryRunner } from "typeorm";
import { logger } from "./logger";

// Սահմանում ենք տիպերը, որոնք TypeORM-ը կարող է լոգ անել
type LogLevel = "query" | "schema" | "error" | "warn" | "info" | "log" | "migration";

export class CustomTypeORMLogger implements TypeORMLogger {
    // Ընդունում ենք լոգինգի մակարդակները Data Source-ից
    constructor(private options?: boolean | LogLevel[] | "all") {}

    // Օժանդակ ֆունկցիա՝ ստուգելու համար, թե արդյոք տվյալ լեվելը պետք է լոգ արվի
    private isLogEnabled(level: LogLevel): boolean {
        if (this.options === "all" || this.options === true) return true;
        if (Array.isArray(this.options)) return this.options.includes(level);
        return false;
    }

    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.isLogEnabled("query")) {
            logger.debug(`Query: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
        }
    }

    logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.isLogEnabled("error")) {
            const errMsg = error instanceof Error ? error.message : error;
            logger.error(`💥 Query Failed: ${errMsg} -- Query: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
        }
    }

    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.isLogEnabled("warn")) {
            logger.warn(`⚠️ Slow Query [${time}ms]: ${query} -- Parameters: ${JSON.stringify(parameters)}`);
        }
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (this.isLogEnabled("schema")) {
            logger.info(`Database Schema: ${message}`);
        }
    }

    logMigration(message: string, queryRunner?: QueryRunner) {
        if (this.isLogEnabled("migration")) {
            logger.info(`Migration: ${message}`);
        }
    }

    log(level: "log" | "info" | "warn", message: any, queryRunner?: QueryRunner) {
        if (level === "warn" && this.isLogEnabled("warn")) {
            logger.warn(message);
        } else if (this.isLogEnabled("info") || this.isLogEnabled("log")) {
            logger.info(message);
        }
    }
}