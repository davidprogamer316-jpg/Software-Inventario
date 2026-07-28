const revokedTokens = new Set<string>()

export function revokeToken(jti: string) {
  revokedTokens.add(jti)
}

export function isTokenRevoked(jti: string): boolean {
  return revokedTokens.has(jti)
}

setInterval(() => {
  if (revokedTokens.size > 10000) {
    revokedTokens.clear()
  }
}, 60 * 60 * 1000)
