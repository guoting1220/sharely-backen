\echo 'Delete and recreate sharely db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE sharely;
CREATE DATABASE sharely;
\connect sharely

\i sharely-schema.sql
\i sharely-seed.sql

\echo 'Delete and recreate sharely_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE sharely_test;
CREATE DATABASE sharely_test;
\connect sharely_test

\i sharely-schema.sql
