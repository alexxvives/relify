-- INT only. Do not apply on production (releva / itsrelify Neon). Apply only on the RELEVA-INT Neon database.
-- Round S42 (Alex): the asesores directory was empty on INT. Since S35 only advisors with an active subscription
-- (billing_customer.advisor_inbox = true) are listed, and the three INT advisors with a complete public profile
-- (int-asesor-fiscal, int-asesor-legal, int-asesor-valoracion) never had a billing_customer row. This gives them a
-- TEST-mode subscription record (fake ids, no Stripe object behind them). Additive and idempotent.
INSERT INTO billing_customer (user_id, stripe_customer_id, plan, advisor_inbox, advisor_subscription_id) SELECT u.id, 'cus_int_s42_' || split_part(u.email, '@', 1), 'none', true, 'sub_int_s42_' || split_part(u.email, '@', 1) FROM "user" u JOIN advisor_profile p ON p.user_id = u.id WHERE u.email IN ('int-asesor-fiscal@test.local', 'int-asesor-legal@test.local', 'int-asesor-valoracion@test.local') ON CONFLICT (user_id) DO NOTHING;
