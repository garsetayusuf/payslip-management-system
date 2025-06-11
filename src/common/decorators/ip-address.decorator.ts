import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    // Check for IP in various headers (common proxy headers)
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip']; // Cloudflare

    let ip: string;

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    } else if (realIp) {
      ip = Array.isArray(realIp) ? realIp[0] : realIp;
    } else if (cfConnectingIp) {
      ip = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    } else {
      // Fallback to Fastify's ip property and raw socket
      ip =
        request.ip ||
        request.socket?.remoteAddress ||
        request.raw?.socket?.remoteAddress ||
        '127.0.0.1';
    }

    // Clean up the IP (remove port if present, handle IPv6)
    if (ip) {
      ip = ip.trim();
      // Handle IPv4-mapped IPv6 addresses
      if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }
      // Remove port if present
      const portIndex = ip.lastIndexOf(':');
      if (portIndex > 0 && ip.indexOf('.') !== -1) {
        // Only remove port for IPv4 addresses
        ip = ip.substring(0, portIndex);
      }
    }

    return ip || '127.0.0.1';
  },
);
