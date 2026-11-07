# CAPÍTULO VI. CONCLUSIONES Y RECOMENDACIONES

## 6.1. Conclusiones

1. **Se cumplió el objetivo general.** Se diseñó e implementó Bandada U como plataforma de nueve microservicios, cinco aplicaciones de cara al usuario y una plataforma de infraestructura reproducible, y se documentó todo el proceso con ICONIX: 24 casos de uso con narrativa, robustez, secuencia y pruebas de aceptación, un modelo de dominio por contextos, ocho modelos estáticos y 25 decisiones de arquitectura registradas.
2. **ICONIX funcionó como columna vertebral.** Pasar cada caso de uso por requisitos, robustez, secuencia e implementación, con revisiones formales entre fases, dio trazabilidad de punta a punta y permitió detectar en el diseño inconsistencias que habrían sido caras en el código (por ejemplo, pasos del texto sin objeto de robustez, o mensajes entre servicios sin contrato). Mantener los nombres del dominio idénticos en diagramas, contratos y código redujo la ambigüedad entre los miembros del equipo.
3. **El enfoque *contract-first* evitó desviaciones.** Escribir primero OpenAPI, AsyncAPI, el esquema GraphQL y las herramientas MCP, y validarlos en integración continua, permitió que servicios escritos en tres lenguajes distintos se integraran sin sorpresas. Las divergencias que aparecieron entre contrato y código se registraron como deuda técnica numerada y se cerraron con evidencia (sección 5.4).
4. **La consistencia distribuida se resolvió con patrones conocidos.** La SAGA orquestada de la inscripción pagada, junto con *transactional outbox*, *inbox* del consumidor, restricciones únicas de negocio, claves de idempotencia HTTP e identificadores generados en el cliente, mantiene el sistema consistente ante reintentos, duplicados, caídas de un servicio y fallos inyectados. La prueba de humo que fuerza un fallo en `ticketing-service` demuestra el rollback completo: el pago se reembolsa y el cupo se libera.
5. **El diseño políglota fue viable y tuvo un costo medible.** Tres lenguajes, tres motores de base de datos y tres arquitecturas de código demostraron que cada contexto puede elegir la herramienta adecuada, a cambio de más trabajo de construcción (tres cadenas de compilación) y de más complejidad operativa. Docker y Compose resolvieron ese costo: cada servicio se empaqueta en una imagen con su propio entorno de ejecución y el mismo artefacto sirve en la máquina del desarrollador y en la nube.
6. **El despliegue multi-nube se simplificó sin perder cumplimiento.** La primera propuesta exigía servicios gestionados, certificados de terceros y listas de acceso por IP. El diseño final usa una red privada cifrada entre AWS, Google Cloud y Azure, contenedores para los datos y DynamoDB como única pieza gestionada obligatoria. Con ello, la regla de la asignatura (los tres servicios de la SAGA en tres proveedores) se cumple con un procedimiento corto, reproducible y explicable.
7. **La verificación automática se tradujo en confianza.** La combinación de pruebas unitarias, de integración, de arquitectura, de contrato y la prueba de humo de extremo a extremo permitió refactorizar y corregir con seguridad. Durante la verificación final se encontró y corrigió un fallo de construcción real (dos servicios Java competían por la misma caché de Gradle al compilarse en paralelo), lo que confirma el valor de reconstruir el sistema desde cero antes de entregar.
8. **La experiencia de usuario fue tratada como requisito.** Tokens de diseño con contraste AA en modo claro y oscuro, internacionalización en español e inglés sin textos literales, funcionamiento sin conexión y un asistente de estudio en el dispositivo no se dejaron para el final: se verificaron con comprobaciones automáticas en cada repositorio.

## 6.2. Recomendaciones

**Para el equipo, antes de la defensa**

- Ejecutar el procedimiento de despliegue de la guía en las tres nubes con tiempo suficiente, registrar los tiempos reales y actualizar la tabla de estado del despliegue de la sección 5.5.
- Reconstruir el sistema desde cero (`make reset && make up && make seed && make smoke`) el día anterior a la demostración, con el árbol de trabajo limpio.
- Ensayar el guion de la defensa, incluido el fallo inyectado en `ticketing-service` y su rollback, y preparar un plan alterno (local) si falla la red del aula.

**Para la evolución del producto**

- **Pagos reales.** Sustituir la pasarela simulada por un proveedor real manteniendo el *webhook* firmado, la acreditación única por pago y el libro de movimientos.
- **Despliegue y operación.** Pasar de una máquina virtual por proveedor a un orquestador (por ejemplo Kubernetes gestionado) solo cuando haya tráfico que lo justifique; añadir despliegue continuo, copias de seguridad programadas y alertas con destinatarios.
- **Seguridad.** Ejecutar un análisis dinámico (OWASP ZAP), rotar las llaves de acceso, sustituir las llaves IAM de larga duración por federación de identidad y añadir autenticación de dos factores real.
- **Calidad del modelo de moderación.** Ampliar el conjunto de validación, monitorear el *recall* en producción y registrar los falsos negativos para reentrenar.
- **Rendimiento.** Ejecutar las pruebas de carga con k6 sobre el entorno desplegado y verificar los objetivos de p95 y de duración de la SAGA frente a la latencia entre nubes.
- **Nuevas capacidades** ya previstas en el alcance: mensajería directa, marketplace estudiantil reutilizando la SAGA, transcripción de videos y OCR de apuntes.

**Para quienes retomen el proyecto**

- Leer primero el índice de la documentación, el catálogo de servicios (fuente de verdad) y la guía de levantamiento local.
- No implementar nada que no esté en `contracts/`; cualquier cambio de catálogo exige un ADR.
- Cerrar cada sesión actualizando el caso de uso, la matriz de trazabilidad y el registro de sesiones.

# 7. BIBLIOGRAFÍA

**Metodología y modelado**

- Rosenberg, D. y Stephens, M. (2007). *Use Case Driven Object Modeling with UML: Theory and Practice*. Apress.
- Rosenberg, D., Stephens, M. y Collins-Cope, M. (2005). *Agile Development with ICONIX Process: People, Process, and Pragmatism*. Apress.
- Fowler, M. (2003). *UML Distilled: A Brief Guide to the Standard Object Modeling Language* (3.ª ed.). Addison-Wesley.
- Sommerville, I. (2016). *Software Engineering* (10.ª ed.). Pearson.

**Arquitectura y patrones**

- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley.
- Cockburn, A. (2005). *Hexagonal architecture*. https://alistair.cockburn.us/hexagonal-architecture/
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Richardson, C. (2018). *Microservices Patterns*. Manning. (Patrones SAGA, *transactional outbox* y *API gateway*.)
- Newman, S. (2021). *Building Microservices* (2.ª ed.). O'Reilly.
- Hohpe, G. y Woolf, B. (2003). *Enterprise Integration Patterns*. Addison-Wesley.

**Estándares y protocolos**

- Nottingham, M., Wilde, E. y Dalal, S. (2023). *RFC 9457: Problem Details for HTTP APIs*. IETF.
- Cloud Native Computing Foundation. *CloudEvents Specification v1.0*. https://cloudevents.io
- OpenAPI Initiative. *OpenAPI Specification v3.1*. https://spec.openapis.org
- AsyncAPI Initiative. *AsyncAPI Specification v3.0*. https://www.asyncapi.com
- GraphQL Foundation. *GraphQL Specification*. https://spec.graphql.org
- Anthropic y comunidad. *Model Context Protocol Specification*. https://modelcontextprotocol.io
- W3C Design Tokens Community Group. *Design Tokens Format Module (DTCG)*. https://www.designtokens.org
- Unicode Consortium. *ICU MessageFormat*. https://unicode-org.github.io/icu/

**Documentación oficial de las tecnologías utilizadas**

- Spring Boot, Spring AMQP y Flyway. https://spring.io · https://flywaydb.org
- NestJS. https://docs.nestjs.com
- Laravel. https://laravel.com/docs
- Expo y React Native. https://docs.expo.dev
- Next.js, Angular y React. https://nextjs.org/docs · https://angular.dev · https://react.dev
- Apollo Server. https://www.apollographql.com/docs
- RabbitMQ. https://www.rabbitmq.com/docs
- PostgreSQL, MongoDB y Amazon DynamoDB. https://www.postgresql.org/docs · https://www.mongodb.com/docs · https://docs.aws.amazon.com/dynamodb
- Docker y la especificación de Compose. https://docs.docker.com · https://compose-spec.io
- Traefik Proxy. https://doc.traefik.io/traefik
- Tailscale. https://tailscale.com/kb
- ONNX Runtime. https://onnxruntime.ai/docs
- n8n. https://docs.n8n.io
- OpenTelemetry y Grafana. https://opentelemetry.io/docs · https://grafana.com/docs
- Amazon Web Services, Google Cloud y Microsoft Azure: documentación de cómputo y de redes. https://docs.aws.amazon.com · https://cloud.google.com/docs · https://learn.microsoft.com/azure

**Documentación del proyecto**

- Equipo Grupo 24 (2026). *Repositorio `bandadau-docs`: documentación ICONIX, contratos y decisiones de arquitectura (ADR-0001 a ADR-0025)*.
