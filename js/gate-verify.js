/**
 * 포털에서 받은 출입증(#ycs=...) 검증 및 자동 로그인
 * - URL의 #ycs 파라미터를 읽는다
 * - 포털의 /api/verify 엔드포인트로 검증한다
 * - 유효하면 출입증의 name으로 자동 로그인한다
 * - 유효하지 않으면 null을 반환한다
 */

const PORTAL_URL = "https://ysu-campus-sync.vercel.app";
const PORTAL_VERIFY_URL = `${PORTAL_URL}/api/verify`;

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
    const verifyRes = await fetch(PORTAL_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, app: "tf" }),
    });

    if (!verifyRes.ok) {
      console.error("[gate-verify] 검증 요청 실패:", verifyRes.status);
      return null;
    }

    const data = await verifyRes.json();
    if (!data.ok) {
      console.warn("[gate-verify] 출입증이 유효하지 않습니다:", data.error);
      return null;
    }

    return data.claims;
  } catch (err) {
    console.error("[gate-verify] 검증 중 오류:", err);
    return null;
  }
}
