/**
 * Multi-tenant resolver
 * Extracts tenant subdomain from hostname
 */
export function getTenantFromHost(host: string): string {
  // Remove port if present
  const hostname = host.split(":")[0];

  // Split by dots
  const parts = hostname.split(".");

  // If localhost or IP address, return default
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return "demo";
  }

  // If subdomain exists, return it (e.g., demo.example.com -> demo)
  if (parts.length >= 3) {
    return parts[0] === "www" ? "default" : parts[0];
  }

  // Default tenant
  return "default";
}

/**
 * Check if the current hostname is a tenant subdomain
 */
export function isTenantSubdomain(host: string): boolean {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  // Check if it's not localhost/IP and has subdomain
  return (
    hostname !== "localhost" &&
    !/^\d+\.\d+\.\d+\.\d+$/.test(hostname) &&
    parts.length >= 3 &&
    parts[0] !== "www"
  );
}
