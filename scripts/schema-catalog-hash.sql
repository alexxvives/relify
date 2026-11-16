-- S30: read-only fingerprint of the public schema (columns, constraints, indexes, enums), _prisma_migrations excluded.
-- Same result on two databases = same physical schema. Used to check prod/INT against a fresh replay of prisma/migrations.
-- Fresh replay of the 51 migrations (S30) and RELEVA prod: ALL = 956 items, md5 ebac9f393bef5dec5b50871d05b4164d.
with items as (
  select 'column' as kind, c.relname || '.' || a.attname as name,
         format_type(a.atttypid, a.atttypmod) || case when a.attnotnull then ' not null' else '' end
         || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '') as def
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
    and c.relname <> '_prisma_migrations'
  union all
  select 'constraint', c.relname || '.' || con.conname, pg_get_constraintdef(con.oid)
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname <> '_prisma_migrations'
  union all
  select 'index', i.tablename || '.' || i.indexname, i.indexdef
  from pg_indexes i
  where i.schemaname = 'public' and i.tablename <> '_prisma_migrations'
  union all
  select 'enum', t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  group by t.typname
)
select kind, count(*) as n, md5(string_agg(name || ' ' || def, E'\n' order by name, def)) as hash
from items group by kind
union all
select 'ALL', count(*), md5(string_agg(kind || ' ' || name || ' ' || def, E'\n' order by kind, name, def)) from items
order by 1
