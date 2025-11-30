import express from "express";
import os from "os";
import fs from "fs";
import pool from "../db/connection.js";
import redisClient from "../db/redis.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const start = Date.now();

    try {
        // Redis 체크
        await redisClient.ping();

        // MySQL 체크
        await pool.query("SELECT 1");

        // CPU 사용률
        const cpus = os.cpus();
        const cpuLoad = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((t, n) => t + n, 0);
        return acc + (cpu.times.user / total) * 100;
        }, 0) / cpus.length;

        // 메모리 사용률
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

        const responseTime = Date.now() - start;

        res.status(200).json({
        status: "ok",
        version: process.env.APP_VERSION || "unknown",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        response_ms: responseTime,

        checks: {
            redis: "connected",
            db: "connected",
        },

        system: {
            cpu_usage_percent: cpuLoad.toFixed(2),
            memory_usage_percent: usedMemPercent.toFixed(2),
            total_memory_mb: (totalMem / 1024 / 1024).toFixed(0),
            free_memory_mb: (freeMem / 1024 / 1024).toFixed(0),
        }
        });

    } catch (error) {
        res.status(500).json({
        status: "error",
        message: error.message,
        });
    }
});

export default router;
