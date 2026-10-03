- [ ] T001 Determine current stable versions of:
  Determine current stable versions of: Java, Spring Boot, Spring AI, PostgreSQL, Liquibase, Testcontainers. Record them
  in docs/adr/0001-stack-versions.md using the ADR format (Context / Decision / Consequences / Alternatives). If Spring
  AI is incompatible with the current Spring Boot — STOP and tell me. Do not guess a version and do not downgrade Boot
  without asking.
- [x] T002 Bootstrap Spring Boot backend using versions from ADR-0001 Create stone-shelter-api Spring Boot application.
  Use the exact versions recorded in ADR-0001. Packages: lab.stoneshelter.{api,domain,persistence,config}
- [ ] T003 Verify backend build
- [ ] T004 Add Dockerfile
- [ ] T005 Add PostgreSQL to Compose
