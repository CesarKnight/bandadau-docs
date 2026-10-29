# ADR-0012 — Infraestructura AWS: un EC2 con Docker Compose + servicios gestionados

- **Estado:** Aceptada — **parcialmente reemplazada por [ADR-0024](ADR-0024-saga-multinube-aws-gcp-azure.md)** (`events-service` pasa a Azure y `wallet-service` a GCP; RDS pasa a ser accesible por lista de IP)
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Presupuesto ≤ USD 60/mes (RNF-18), equipo pequeño, experiencia previa en Homy con AWS barato, y la
cátedra exige DynamoDB en AWS (C4).

## Decisión

Un **EC2 t3.xlarge** con Docker Compose para servicios, RabbitMQ, MongoDB, n8n y LGTM; **RDS
PostgreSQL** db.t4g.micro; **DynamoDB on-demand**; **S3 + CloudFront** para estáticos (landing, admin,
MFEs, app web) y media. Secretos en Secrets Manager/SSM.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| EKS / ECS Fargate | Más robusto y escalable, pero costo y complejidad fuera de alcance. |
| Todo en el EC2 (incluido Postgres) | Más barato, pero sin backups gestionados. |
| PaaS (Render, Fly) | Menos control y sin DynamoDB nativo. |

## Consecuencias

- (+) Costo bajo y paridad con `make up` local.
- (+) Servicios gestionados donde importa (datos).
- (−) Punto único de falla en el EC2 (aceptado para demo).
- (−) Escalado vertical manual.

## Referencias

`arquitectura-general.md` §7, `05-infraestructura/infraestructura.md`
