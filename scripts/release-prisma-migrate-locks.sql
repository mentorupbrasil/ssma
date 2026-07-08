-- Libera sessões idle segurando o advisory lock do Prisma Migrate (objid 72707369).
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks PL
JOIN pg_stat_activity PSA ON PSA.pid = PL.pid
WHERE PL.locktype = 'advisory'
  AND PL.classid = 0
  AND PL.objid = 72707369
  AND PSA.pid <> pg_backend_pid()
  AND PSA.state IN ('idle', 'idle in transaction');
