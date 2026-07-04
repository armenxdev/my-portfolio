import { createHash } from 'crypto';

export interface DeviceInfo {
    fingerprint: string;
    userAgent: string;
    ip: string;
    country?: string;
    city?: string;
}

export class DeviceFingerprintService {
    /**
     * Generate unique device fingerprint from request
     */
    generateFingerprint(req: any): string {
        const userAgent = req.headers['user-agent'] || '';
        const acceptLanguage = req.headers['accept-language'] || '';
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const ip = this.getClientIp(req);

        // Create hash from device characteristics
        const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
        return createHash('sha256').update(fingerprintData).digest('hex').substring(0, 32);
    }

    /**
     * Extract client IP from request (handles proxies)
     */
    getClientIp(req: any): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.connection?.remoteAddress || 'unknown';
    }

    /**
     * Get full device info from request
     */
    getDeviceInfo(req: any): DeviceInfo {
        const fingerprint = this.generateFingerprint(req);
        const userAgent = req.headers['user-agent'] || '';
        const ip = this.getClientIp(req);

        // Parse basic device info from User-Agent (simplified)
        const deviceInfo = this.parseUserAgent(userAgent);

        return {
            fingerprint,
            userAgent,
            ip,
            ...deviceInfo,
        };
    }

    /**
     * Parse User-Agent string for basic device info
     */
    private parseUserAgent(userAgent: string): { country?: string; city?: string } {
        // This is simplified - in production, use a library like ua-parser-js
        // or a geo-IP service for location data
        return {};
    }

    /**
     * Get human-readable device description
     */
    getDeviceDescription(userAgent: string): string {
        if (!userAgent) return 'Unknown Device';

        const ua = userAgent.toLowerCase();

        if (ua.includes('mobile')) return 'Mobile Device';
        if (ua.includes('tablet')) return 'Tablet';
        if (ua.includes('windows')) return 'Windows PC';
        if (ua.includes('macintosh')) return 'Mac';
        if (ua.includes('linux')) return 'Linux PC';
        if (ua.includes('iphone')) return 'iPhone';
        if (ua.includes('ipad')) return 'iPad';
        if (ua.includes('android')) return 'Android Device';

        return 'Unknown Device';
    }
}

export default DeviceFingerprintService;
