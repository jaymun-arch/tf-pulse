/**
 * 포털에서 받은 출입증(#ycs=...) 검증 및 자동 로그인
 * - URL의 #ycs 파라미터를 읽는다
 * - 포털의 공개키로 서명을 검증한다
 * - 유효하면 출입증의 name으로 자동 로그인한다
 * - 유효하지 않으면 null을 반환한다
 */

const PORTAL_URL = "https://ysu-campus-sync.vercel.app";
const PORTAL_SSO_KEY_URL = `${PORTAL_URL}/api/sso-key`;

/**
 * URL의 #ycs 티켓을 검증하고 클레임을 반환한다.
 * 유효하지 않거나 없으면 null을 반환한다.
 */
export async function verifyTicketFromUrl() {
  const hash = window.location.hash;
  const match = hash.match(/#ycs=([^&]*)/);
  if (!match) return null;

  const ticket = match[1];
  if (!ticket) return null;

  try {
    const keyRes = await fetch(PORTAL_SSO_KEY_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!keyRes.ok) {
      console.error("[gate-verify] 공개키 조회 실패:", keyRes.status);
      return null;
    }

    const keyData = await keyRes.json();
    const jwk = keyData.jwk;

    const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["verify"]);

    const claims = await verifyToken(ticket, publicKey);
    if (!claims) {
      console.warn("[gate-verify] 출입증이 유효하지 않습니다");
      return null;
    }

    if (claims.aud !== "tf") {
      console.warn("[gate-verify] 이 앱이 아닙니다:", claims.aud);
      return null;
    }

    return claims;
  } catch (err) {
    console.error("[gate-verify] 검증 중 오류:", err);
    return null;
  }
}

async function verifyToken(token, publicKey) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;

  try {
    const bodyBuf = base64urlToBuffer(body);
    const sigBuf = base64urlToBuffer(sig);

    const isValid = await crypto.subtle.verify("Ed25519", publicKey, sigBuf, bodyBuf);

    if (!isValid) return null;

    const claims = JSON.parse(new TextDecoder().decode(bodyBuf));

    if (claims.iss !== "ysu-campus-sync") return null;

    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;

    if (claims.typ !== "ticket") return null;

    return claims;
  } catch (err) {
    console.error("[verifyToken] 오류:", err);
    return null;
  }
}

function base64urlToBuffer(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".substring(0, (4 - (base64.length % 4)) % 4);
  const binaryStr = atob(padded);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
