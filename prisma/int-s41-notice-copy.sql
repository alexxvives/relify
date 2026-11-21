-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- Round S41 (Alex): the buyer's "X está en Contrato" aviso keeps one line, matching accept-loi.ts. Idempotent.
UPDATE notification SET body = 'El vendedor aceptó tu carta de intenciones.' WHERE body = 'El vendedor aceptó tu carta de intenciones. El siguiente paso es el contrato de compraventa.';
