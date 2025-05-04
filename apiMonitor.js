const os = require('os');

class ApiMonitor {
    constructor() {
        this.requests = {};
        this.apiStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            endpoints: {},
            apiKeys: {},
            startTime: Date.now()
        };

        this.rateLimits = {
            free: { count: 0, limit: 100, windowMs: 3600000, lastReset: Date.now() },
            premium: { count: 0, limit: 1000, windowMs: 3600000, lastReset: Date.now() },
            admin: { count: 0, limit: 10000, windowMs: 3600000, lastReset: Date.now() }
        };
    }

    trackRequest(endpoint, apiKey) {
        if (!endpoint.startsWith('/api/')) return;

        const now = Date.now();
        this.apiStats.totalRequests++;

        if (!this.apiStats.endpoints[endpoint]) {
            this.apiStats.endpoints[endpoint] = { count: 0, success: 0, fail: 0, lastUsed: now };
        }
        this.apiStats.endpoints[endpoint].count++;
        this.apiStats.endpoints[endpoint].lastUsed = now;

        if (!this.apiStats.apiKeys[apiKey]) {
            this.apiStats.apiKeys[apiKey] = { count: 0, lastUsed: now };
        }
        this.apiStats.apiKeys[apiKey].count++;
        this.apiStats.apiKeys[apiKey].lastUsed = now;

        if (this.rateLimits[apiKey]) {
            if (now - this.rateLimits[apiKey].lastReset > this.rateLimits[apiKey].windowMs) {
                this.rateLimits[apiKey].count = 0;
                this.rateLimits[apiKey].lastReset = now;
            }
            this.rateLimits[apiKey].count++;
        }
    }

    isRateLimited(apiKey) {
        if (!this.rateLimits[apiKey]) return false;

        const now = Date.now();
        if (now - this.rateLimits[apiKey].lastReset > this.rateLimits[apiKey].windowMs) {
            this.rateLimits[apiKey].count = 0;
            this.rateLimits[apiKey].lastReset = now;
            return false;
        }

        return this.rateLimits[apiKey].count >= this.rateLimits[apiKey].limit;
    }

    recordSuccess(endpoint) {
        if (!endpoint.startsWith('/api/')) return;

        this.apiStats.successfulRequests++;
        if (this.apiStats.endpoints[endpoint]) {
            this.apiStats.endpoints[endpoint].success++;
            this.apiStats.endpoints[endpoint].lastUsed = Date.now();
        }
    }

    recordFailure(endpoint) {
        if (!endpoint.startsWith('/api/')) return;

        this.apiStats.failedRequests++;
        if (this.apiStats.endpoints[endpoint]) {
            this.apiStats.endpoints[endpoint].fail++;
            this.apiStats.endpoints[endpoint].lastUsed = Date.now();
        }
    }

    getStats() {
        const now = Date.now();
        const uptime = now - this.apiStats.startTime;
        const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.system + cpuUsage.user) / 1000; 

        return {
            totalRequests: this.apiStats.totalRequests,
            successfulRequests: this.apiStats.successfulRequests,
            failedRequests: this.apiStats.failedRequests,
            uptime: `${uptimeHours}h ${uptimeMinutes}m`,
            cpuUsage: cpuPercent,
            memoryUsage: process.memoryUsage(),
            systemMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAvg: os.loadavg(),
            apiKeys: this.apiStats.apiKeys,
            topEndpoints: Object.entries(this.apiStats.endpoints)
                .filter(([path]) => path.startsWith('/api/'))
                .map(([path, stats]) => ({ path, ...stats }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            recentActivity: Object.entries(this.apiStats.endpoints)
                .filter(([path]) => path.startsWith('/api/'))
                .map(([path, stats]) => ({ path, ...stats }))
                .filter(e => e.count > 0)
                .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
                .slice(0, 5)
        };
    }
}

const apiMonitor = new ApiMonitor();
module.exports = apiMonitor;