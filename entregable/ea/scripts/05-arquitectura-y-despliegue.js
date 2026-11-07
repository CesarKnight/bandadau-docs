// Bandada U - 05 Arquitectura y despliegue (4 diagramas)
var SCRIPT_TITLE = "Bandada U - 05 Arquitectura y despliegue";
var DIAGRAMS = [{"type":"arch","title":"Vista de contenedores (arquitectura)","path":["Arquitectura"],"nodes":[{"id":"g:Clientes","kind":"boundary","name":"Clientes","pos":"l=20;r=686;t=-20;b=-242;","stereo":"subsystem"},{"id":"g:Servicios","kind":"boundary","name":"Servicios","pos":"l=734;r=1400;t=-20;b=-336;","stereo":"subsystem"},{"id":"g:Datos","kind":"boundary","name":"Datos","pos":"l=1448;r=1900;t=-20;b=-242;","stereo":"subsystem"},{"id":"LAND","kind":"component","name":"Landing","pos":"l=44;r=234;t=-54;b=-124;","notes":"Next.js static"},{"id":"APP","kind":"component","name":"App Expo SDK 57","pos":"l=258;r=448;t=-54;b=-124;","notes":"iOS \u00b7 Android \u00b7 Web PWA\n+ IA local"},{"id":"SHELL","kind":"component","name":"Admin shell","pos":"l=472;r=662;t=-54;b=-124;","notes":"Next.js static"},{"id":"MFE1","kind":"component","name":"mfe-moderation","pos":"l=44;r=234;t=-148;b=-218;","notes":"Angular \u2192 Web Component"},{"id":"MFE2","kind":"component","name":"mfe-insights","pos":"l=258;r=448;t=-148;b=-218;","notes":"React \u2192 Web Component"},{"id":"ID","kind":"component","name":"identity-service","pos":"l=758;r=948;t=-54;b=-124;","notes":"Spring \u00b7 Hexagonal"},{"id":"SO","kind":"component","name":"social-service","pos":"l=972;r=1162;t=-54;b=-124;","notes":"NestJS \u00b7 Clean"},{"id":"ME","kind":"component","name":"media-service","pos":"l=1186;r=1376;t=-54;b=-124;","notes":"NestJS \u00b7 Clean \u00b7 ONNX"},{"id":"EV","kind":"component","name":"events-service","pos":"l=758;r=948;t=-148;b=-218;","notes":"Spring \u00b7 DDD \u00b7 Orquestador SAGA"},{"id":"WA","kind":"component","name":"wallet-service","pos":"l=972;r=1162;t=-148;b=-218;","notes":"Laravel \u00b7 Hexagonal"},{"id":"TI","kind":"component","name":"ticketing-service","pos":"l=1186;r=1376;t=-148;b=-218;","notes":"NestJS \u00b7 Clean"},{"id":"NO","kind":"component","name":"notification-service","pos":"l=758;r=948;t=-242;b=-312;","notes":"Laravel \u00b7 Clean"},{"id":"IN","kind":"component","name":"insights-service","pos":"l=972;r=1162;t=-242;b=-312;","notes":"NestJS \u00b7 Clean\nAgentes + MCP server"},{"id":"AG","kind":"component","name":"admin-gateway","pos":"l=1186;r=1376;t=-242;b=-312;","notes":"NestJS \u00b7 GraphQL"},{"id":"PG","kind":"component","name":"PostgreSQL","pos":"l=1472;r=1662;t=-54;b=-124;","stereo":"datastore","notes":"identity \u00b7 events \u00b7 wallet"},{"id":"MG","kind":"component","name":"MongoDB rs0","pos":"l=1686;r=1876;t=-54;b=-124;","stereo":"datastore","notes":"social \u00b7 media"},{"id":"DY","kind":"component","name":"DynamoDB","pos":"l=1472;r=1662;t=-148;b=-218;","stereo":"datastore","notes":"ticketing \u00b7 notifications\ninsights \u00b7 idempotency"},{"id":"S3","kind":"component","name":"S3 / MinIO","pos":"l=1686;r=1876;t=-148;b=-218;","stereo":"datastore"},{"id":"GW","kind":"component","name":"Traefik","pos":"l=20;r=210;t=-384;b=-454;","notes":"API Gateway"},{"id":"MQ","kind":"component","name":"RabbitMQ","pos":"l=734;r=924;t=-384;b=-454;","stereo":"message broker","notes":"bandada.events / bandada.commands"},{"id":"N8N","kind":"component","name":"n8n","pos":"l=1448;r=1638;t=-384;b=-454;"}],"edges":[{"from":"LAND","to":"GW","type":"Association","label":"","dir":"Source -> Destination"},{"from":"APP","to":"GW","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SHELL","to":"MFE1","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SHELL","to":"MFE2","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SHELL","to":"GW","type":"Association","label":"GraphQL","dir":"Source -> Destination"},{"from":"MFE1","to":"GW","type":"Association","label":"GraphQL","dir":"Source -> Destination"},{"from":"MFE2","to":"GW","type":"Association","label":"GraphQL","dir":"Source -> Destination"},{"from":"GW","to":"ID","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"SO","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"ME","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"EV","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"WA","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"TI","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"NO","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"IN","type":"Association","label":"","dir":"Source -> Destination"},{"from":"GW","to":"AG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"AG","to":"ID","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"SO","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"ME","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"EV","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"WA","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"TI","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"AG","to":"IN","type":"Association","label":"REST /internal","dir":"Source -> Destination"},{"from":"IN","to":"SO","type":"Association","label":"MCP tools \u2192 REST /internal","dir":"Source -> Destination"},{"from":"IN","to":"EV","type":"Association","label":"MCP tools \u2192 REST /internal","dir":"Source -> Destination"},{"from":"IN","to":"WA","type":"Association","label":"MCP tools \u2192 REST /internal","dir":"Source -> Destination"},{"from":"IN","to":"ME","type":"Association","label":"MCP tools \u2192 REST /internal","dir":"Source -> Destination"},{"from":"ID","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"EV","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"WA","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SO","to":"MG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ME","to":"MG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TI","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"NO","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"IN","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ME","to":"S3","type":"Association","label":"","dir":"Source -> Destination"},{"from":"IN","to":"S3","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ID","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"SO","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"ME","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"EV","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"WA","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"TI","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"NO","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"IN","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"MQ","to":"N8N","type":"Association","label":"","dir":"Bi-Directional"}]},{"type":"arch","title":"Mapa de contextos (DDD estrategico)","path":["Arquitectura"],"nodes":[{"id":"IDN","kind":"component","name":"Identidad","pos":"l=20;r=210;t=-20;b=-90;","stereo":"bounded context","notes":"(upstream, OHS + PL: JWT/JWKS)"},{"id":"SOC","kind":"component","name":"Social","pos":"l=258;r=448;t=-20;b=-90;","stereo":"bounded context"},{"id":"MED","kind":"component","name":"Media","pos":"l=496;r=686;t=-20;b=-90;","stereo":"bounded context"},{"id":"EVT","kind":"component","name":"Eventos","pos":"l=20;r=210;t=-138;b=-208;","stereo":"bounded context","notes":"(orquestador)"},{"id":"WAL","kind":"component","name":"Billetera","pos":"l=258;r=448;t=-138;b=-208;","stereo":"bounded context"},{"id":"TIC","kind":"component","name":"Entradas","pos":"l=496;r=686;t=-138;b=-208;","stereo":"bounded context"},{"id":"NOT","kind":"component","name":"Notificaciones","pos":"l=20;r=210;t=-256;b=-326;","stereo":"bounded context"},{"id":"INS","kind":"component","name":"Insights","pos":"l=258;r=448;t=-256;b=-326;","stereo":"bounded context"}],"edges":[{"from":"IDN","to":"SOC","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"IDN","to":"EVT","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"IDN","to":"WAL","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"IDN","to":"TIC","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"IDN","to":"NOT","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"IDN","to":"INS","type":"Dependency","label":"Published Language (JWT, user.registered)","dir":"Source -> Destination"},{"from":"MED","to":"SOC","type":"Dependency","label":"asset.approved / flagged","dir":"Source -> Destination"},{"from":"EVT","to":"WAL","type":"Dependency","label":"comandos SAGA (Customer/Supplier)","dir":"Source -> Destination"},{"from":"EVT","to":"TIC","type":"Dependency","label":"comandos SAGA (Customer/Supplier)","dir":"Source -> Destination"},{"from":"SOC","to":"NOT","type":"Dependency","label":"eventos de dominio (conformist)","dir":"Source -> Destination"},{"from":"EVT","to":"NOT","type":"Dependency","label":"eventos de dominio (conformist)","dir":"Source -> Destination"},{"from":"WAL","to":"NOT","type":"Dependency","label":"eventos de dominio (conformist)","dir":"Source -> Destination"},{"from":"MED","to":"NOT","type":"Dependency","label":"eventos de dominio (conformist)","dir":"Source -> Destination"},{"from":"SOC","to":"INS","type":"Dependency","label":"eventos (conformist, ACL)","dir":"Source -> Destination"},{"from":"EVT","to":"INS","type":"Dependency","label":"eventos (conformist, ACL)","dir":"Source -> Destination"},{"from":"WAL","to":"INS","type":"Dependency","label":"eventos (conformist, ACL)","dir":"Source -> Destination"},{"from":"MED","to":"INS","type":"Dependency","label":"eventos (conformist, ACL)","dir":"Source -> Destination"},{"from":"TIC","to":"INS","type":"Dependency","label":"eventos (conformist, ACL)","dir":"Source -> Destination"}]},{"type":"arch","title":"Despliegue local (Docker Compose)","path":["Despliegue"],"nodes":[{"id":"g:host","kind":"node","name":"Laptop (Docker Desktop / OrbStack) - red bridge bandada","pos":"l=20;r=1900;t=-20;b=-546;","stereo":"execution environment"},{"id":"g:svc","kind":"node","name":"perfil services","pos":"l=44;r=710;t=-54;b=-370;","stereo":"execution environment"},{"id":"g:data","kind":"node","name":"perfil infra: datos","pos":"l=734;r=1400;t=-54;b=-276;","stereo":"execution environment"},{"id":"g:ops","kind":"node","name":"perfil infra: operaci\u00f3n","pos":"l=1424;r=1876;t=-54;b=-182;","stereo":"execution environment"},{"id":"g:obs","kind":"node","name":"perfiles opcionales","pos":"l=44;r=496;t=-394;b=-522;","stereo":"execution environment"},{"id":"g:hostapps","kind":"node","name":"Procesos en el host (pnpm dev)","pos":"l=1948;r=2614;t=-20;b=-242;","stereo":"execution environment"},{"id":"ID","kind":"component","name":"identity-service :7001","pos":"l=68;r=258;t=-88;b=-158;"},{"id":"SO","kind":"component","name":"social-service :7002","pos":"l=282;r=472;t=-88;b=-158;"},{"id":"ME","kind":"component","name":"media-service :7003","pos":"l=496;r=686;t=-88;b=-158;"},{"id":"EV","kind":"component","name":"events-service :7004","pos":"l=68;r=258;t=-182;b=-252;"},{"id":"WA","kind":"component","name":"wallet-service :7005","pos":"l=282;r=472;t=-182;b=-252;","notes":"+ wallet-worker + wallet-relay"},{"id":"TI","kind":"component","name":"ticketing-service :7006","pos":"l=496;r=686;t=-182;b=-252;"},{"id":"NO","kind":"component","name":"notification-service :7007","pos":"l=68;r=258;t=-276;b=-346;","notes":"+ notification-worker + notification-relay"},{"id":"AG","kind":"component","name":"admin-gateway :7010","pos":"l=282;r=472;t=-276;b=-346;"},{"id":"IN","kind":"component","name":"insights-service :7008","pos":"l=496;r=686;t=-276;b=-346;","notes":"(pendiente fase 2)"},{"id":"PG","kind":"component","name":"postgres 18.6 :5432","pos":"l=758;r=948;t=-88;b=-158;","stereo":"datastore"},{"id":"MG","kind":"component","name":"mongo 8.0.19 rs0 :27017","pos":"l=972;r=1162;t=-88;b=-158;","stereo":"datastore"},{"id":"DY","kind":"component","name":"dynamodb-local :8000","pos":"l=1186;r=1376;t=-88;b=-158;","stereo":"datastore"},{"id":"MQ","kind":"component","name":"rabbitmq 4.2.9-management","pos":"l=758;r=948;t=-182;b=-252;","stereo":"message broker","notes":":5672 / :15672"},{"id":"S3","kind":"component","name":"minio pgsty :9000 / :9001","pos":"l=972;r=1162;t=-182;b=-252;","stereo":"datastore"},{"id":"N8N","kind":"component","name":"n8n 2.43.5 (SQLite) :5678","pos":"l=1448;r=1638;t=-88;b=-158;"},{"id":"MP","kind":"component","name":"mailpit :8025 / :1025","pos":"l=1662;r=1852;t=-88;b=-158;"},{"id":"LGTM","kind":"component","name":"otel-lgtm (observability)","pos":"l=68;r=258;t=-428;b=-498;","notes":"Grafana :3300 \u00b7 OTLP :4317/:4318"},{"id":"OL","kind":"component","name":"ollama (llm, pendiente fase 2)","pos":"l=282;r=472;t=-428;b=-498;"},{"id":"TR","kind":"component","name":"traefik :80","pos":"l=734;r=924;t=-394;b=-464;","notes":"dashboard :8080"},{"id":"LA","kind":"component","name":"landing :3000","pos":"l=1972;r=2162;t=-54;b=-124;"},{"id":"SH","kind":"component","name":"admin-shell :3001","pos":"l=2186;r=2376;t=-54;b=-124;"},{"id":"M1","kind":"component","name":"mfe-moderation :4201","pos":"l=2400;r=2590;t=-54;b=-124;"},{"id":"M2","kind":"component","name":"mfe-insights :4301","pos":"l=1972;r=2162;t=-148;b=-218;"},{"id":"MO","kind":"component","name":"mobile (Metro / web) :8081","pos":"l=2186;r=2376;t=-148;b=-218;"}],"edges":[{"from":"TR","to":"ID","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"SO","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"ME","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"EV","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"WA","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"TI","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"NO","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"AG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"IN","type":"Association","label":"502 hasta la fase 2","dir":"Source -> Destination"},{"from":"TR","to":"LA","type":"Association","label":"host.docker.internal","dir":"Source -> Destination"},{"from":"TR","to":"SH","type":"Association","label":"host.docker.internal","dir":"Source -> Destination"},{"from":"TR","to":"M1","type":"Association","label":"host.docker.internal","dir":"Source -> Destination"},{"from":"TR","to":"M2","type":"Association","label":"host.docker.internal","dir":"Source -> Destination"},{"from":"TR","to":"MO","type":"Association","label":"host.docker.internal","dir":"Source -> Destination"},{"from":"ID","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"EV","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"WA","to":"PG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SO","to":"MG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ME","to":"MG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"SO","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ME","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"EV","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"WA","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TI","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"NO","to":"DY","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ME","to":"S3","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ID","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"SO","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"ME","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"EV","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"WA","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"TI","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"NO","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"AG","to":"MQ","type":"Association","label":"","dir":"Bi-Directional"},{"from":"MQ","to":"N8N","type":"Association","label":"","dir":"Bi-Directional"},{"from":"ID","to":"MP","type":"Association","label":"","dir":"Source -> Destination"},{"from":"N8N","to":"MP","type":"Association","label":"","dir":"Source -> Destination"},{"from":"NO","to":"MP","type":"Association","label":"","dir":"Source -> Destination"},{"from":"ID","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"SO","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"ME","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"EV","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"WA","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"TI","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"NO","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"},{"from":"AG","to":"LGTM","type":"Association","label":"OTLP opcional","dir":"Source -> Destination"}]},{"type":"arch","title":"Despliegue en la nube (AWS + Azure + GCP con Tailscale)","path":["Despliegue"],"nodes":[{"id":"g:TS","kind":"node","name":"Red privada Tailscale (WireGuard) 100.x.x.x","pos":"l=20;r=782;t=-20;b=-452;","stereo":"execution environment"},{"id":"g:AWS","kind":"node","name":"AWS \u00b7 EC2 (\u00fanica VM con puertos p\u00fablicos 80 y 443)","pos":"l=44;r=496;t=-54;b=-276;","stereo":"execution environment"},{"id":"g:AZ","kind":"node","name":"Azure \u00b7 VM (sin puertos p\u00fablicos)","pos":"l=520;r=758;t=-54;b=-182;","stereo":"execution environment"},{"id":"g:GC","kind":"node","name":"GCP \u00b7 VM (sin puertos p\u00fablicos)","pos":"l=44;r=282;t=-300;b=-428;","stereo":"execution environment"},{"id":"TR","kind":"component","name":"Traefik","pos":"l=68;r=258;t=-88;b=-158;","notes":"TLS Let's Encrypt"},{"id":"NG","kind":"component","name":"nginx est\u00e1ticos","pos":"l=282;r=472;t=-88;b=-158;","notes":"landing \u00b7 app \u00b7 panel \u00b7 mfes"},{"id":"SV","kind":"component","name":"identity \u00b7 social \u00b7 media \u00b7 ticketing","pos":"l=68;r=258;t=-182;b=-252;","notes":"notification \u00b7 insights \u00b7 admin-gateway"},{"id":"DATA","kind":"component","name":"Postgres 3 bases \u00b7 Mongo rs0","pos":"l=282;r=472;t=-182;b=-252;","stereo":"datastore","notes":"RabbitMQ \u00b7 MinIO \u00b7 Mailpit \u00b7 n8n"},{"id":"EV","kind":"component","name":"events-service (Java)","pos":"l=544;r=734;t=-88;b=-158;","notes":"orquestador SAGA"},{"id":"WA","kind":"component","name":"wallet-service + worker + relay (PHP)","pos":"l=68;r=258;t=-334;b=-404;"},{"id":"U","kind":"component","name":"Navegador y app m\u00f3vil","pos":"l=830;r=1020;t=-20;b=-90;"},{"id":"DNS","kind":"component","name":"DNS del dominio","pos":"l=1068;r=1258;t=-20;b=-90;","notes":"registros A hacia la IP el\u00e1stica"},{"id":"DDB","kind":"component","name":"DynamoDB real","pos":"l=20;r=210;t=-500;b=-570;","stereo":"datastore","notes":"4 tablas \u00b7 AWS"},{"id":"GHCR","kind":"component","name":"GHCR","pos":"l=830;r=1020;t=-500;b=-570;","notes":"im\u00e1genes de los 9 servicios"},{"id":"AWS","kind":"component","name":"AWS","pos":"l=1068;r=1258;t=-500;b=-570;"},{"id":"AZ","kind":"component","name":"AZ","pos":"l=20;r=210;t=-618;b=-688;"},{"id":"GC","kind":"component","name":"GC","pos":"l=830;r=1020;t=-618;b=-688;"}],"edges":[{"from":"U","to":"DNS","type":"Association","label":"","dir":"Source -> Destination"},{"from":"DNS","to":"TR","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"NG","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"SV","type":"Association","label":"","dir":"Source -> Destination"},{"from":"TR","to":"EV","type":"Association","label":"http://TS_IP_AZURE:7004","dir":"Source -> Destination"},{"from":"TR","to":"WA","type":"Association","label":"http://TS_IP_GCP:7005","dir":"Source -> Destination"},{"from":"SV","to":"DATA","type":"Association","label":"","dir":"Source -> Destination"},{"from":"EV","to":"DATA","type":"Association","label":"Postgres 5432 \u00b7 RabbitMQ 5672 identity 7001 \u00b7 media 7003","dir":"Source -> Destination"},{"from":"WA","to":"DATA","type":"Association","label":"Postgres 5432 \u00b7 RabbitMQ 5672","dir":"Source -> Destination"},{"from":"SV","to":"DDB","type":"Association","label":"rol de la instancia","dir":"Source -> Destination"},{"from":"WA","to":"DDB","type":"Association","label":"usuario IAM m\u00ednimo (wallet-service#*)","dir":"Source -> Destination"},{"from":"GHCR","to":"AWS","type":"Association","label":"pull","dir":"Source -> Destination"},{"from":"GHCR","to":"AZ","type":"Association","label":"pull","dir":"Source -> Destination"},{"from":"GHCR","to":"GC","type":"Association","label":"pull","dir":"Source -> Destination"}]}];

// =============================================================================
// Bandada U - Importador de diagramas para Enterprise Architect (JScript)
// Generado por entregable/ea/generar-scripts-ea.mjs. NO editar a mano:
// edita la documentacion Mermaid y vuelve a generar.
//
// Requisitos: EA con un proyecto abierto. Se ejecuta desde
//   View > Scripting > (clic derecho en "Normal Scripts") New Script > JScript
// Pega todo este archivo y pulsa "Run". El resultado aparece en la pestana
// "Script" de la ventana System Output.
// Escrito en JScript clasico (ES3): sin let/const/flechas/forEach/indexOf.
// =============================================================================

var EA_TYPE_BY_KIND = {
  actor: "Actor",
  usecase: "UseCase",
  boundary: "Boundary",
  control: "Control",
  entity: "Entity",
  "class": "Class",
  object: "Object",
  component: "Component",
  node: "Node",
  state: "State",
  initial: "StateNode",
  final: "StateNode",
  note: "Note"
};

var DIAGRAM_TYPE = {
  usecase: "Use Case",
  arch: "Component",
  state: "Statechart",
  "class": "Class",
  robust: "Analysis",
  seq: "Sequence"
};

var stats = { packages: 0, elements: 0, connectors: 0, diagrams: 0, warnings: 0 };

function log(msg) {
  Session.Output(msg);
}

function warn(msg) {
  stats.warnings++;
  Session.Output("AVISO: " + msg);
}

function childPackage(parent, name) {
  var i, p;
  for (i = 0; i < parent.Packages.Count; i++) {
    p = parent.Packages.GetAt(i);
    if (p.Name == name) {
      return p;
    }
  }
  p = parent.Packages.AddNew(name, "");
  p.Update();
  parent.Packages.Refresh();
  stats.packages++;
  return p;
}

function packagePath(root, path) {
  var cur = root, i;
  for (i = 0; i < path.length; i++) {
    cur = childPackage(cur, path[i]);
  }
  return cur;
}

function addAttributes(el, attrs) {
  var i, a, parts, at;
  for (i = 0; i < attrs.length; i++) {
    a = attrs[i];
    at = el.Attributes.AddNew(a.name, a.type || "");
    if (a.vis) {
      at.Visibility = a.vis;
    }
    at.Update();
  }
  if (attrs.length > 0) {
    el.Attributes.Refresh();
  }
}

function addMethods(el, ops) {
  var i, o, m;
  for (i = 0; i < ops.length; i++) {
    o = ops[i];
    m = el.Methods.AddNew(o.name, o.ret || "");
    if (o.vis) {
      m.Visibility = o.vis;
    }
    if (o.isStatic) {
      m.IsStatic = true;
    }
    if (o.params) {
      m.Notes = "(" + o.params + ")";
    }
    m.Update();
  }
  if (ops.length > 0) {
    el.Methods.Refresh();
  }
}

// Posicion de cada nodo segun el tipo de diagrama.
function layoutNodes(d) {
  var i, n, col, row, cols = {}, counters = {}, x, y, w, h, k;
  var lifeIdx = 0, lifelines = 0;
  for (i = 0; i < d.nodes.length; i++) {
    if (d.nodes[i].kind != "note") {
      lifelines++;
    }
  }
  var colX = { actor: 20, boundary: 220, control: 460, entity: 700 };
  for (i = 0; i < d.nodes.length; i++) {
    n = d.nodes[i];
    w = 150;
    h = 60;
    if (d.type == "robust") {
      k = n.kind;
      counters[k] = (counters[k] || 0) + 1;
      x = colX[k] || 20;
      y = 20 + (counters[k] - 1) * 90;
    } else if (d.type == "usecase") {
      if (n.kind == "actor") {
        counters.actor = (counters.actor || 0) + 1;
        x = 20;
        y = 20 + (counters.actor - 1) * 110;
      } else {
        k = n.group || "";
        if (cols[k] === undefined) {
          cols.count = (cols.count || 0) + 1;
          cols[k] = cols.count;
        }
        counters[k] = (counters[k] || 0) + 1;
        x = 60 + cols[k] * 220;
        y = 20 + (counters[k] - 1) * 80;
        w = 190;
      }
    } else if (d.type == "seq") {
      if (n.kind == "note") {
        counters.note = (counters.note || 0) + 1;
        x = 20 + (d.nodes.length - counters.note) * 0;
        x = 20 + lifelines * 150 + 40;
        y = 20 + (counters.note - 1) * 90;
        w = 200;
        h = 70;
        n.pos = "l=" + x + ";r=" + (x + w) + ";t=-" + y + ";b=-" + (y + h) + ";";
        continue;
      }
      lifeIdx++;
      x = 20 + (lifeIdx - 1) * 150;
      y = 20;
      w = 130;
      h = 60 + 28 * (d.edges.length + 1);
    } else {
      // clase: rejilla de 4 columnas (luego se intenta autoacomodo)
      h = 50 + 15 * ((n.attrs ? n.attrs.length : 0) + (n.ops ? n.ops.length : 0));
      w = 190;
      x = 20 + (i % 4) * 240;
      y = 20 + Math.floor(i / 4) * 230;
    }
    if (n.pos) {
      continue;
    }
    n.pos = "l=" + x + ";r=" + (x + w) + ";t=-" + y + ";b=-" + (y + h) + ";";
  }
}

function buildDiagram(root, d) {
  var pkgRoot = packagePath(root, d.path);
  var diagram = pkgRoot.Diagrams.AddNew(d.title, DIAGRAM_TYPE[d.type]);
  diagram.Update();
  stats.diagrams++;

  var byId = {}, i, n, el, pk, dobj, e, src, dst, con, ctype, pos;

  layoutNodes(d);

  for (i = 0; i < d.nodes.length; i++) {
    n = d.nodes[i];
    pk = n.group && (d.type == "class" || d.type == "usecase") && n.kind != "actor"
      ? childPackage(pkgRoot, n.group) : pkgRoot;
    el = pk.Elements.AddNew(n.name, EA_TYPE_BY_KIND[n.kind] || "Class");
    if (n.kind == "initial") {
      el.Subtype = 100;
    }
    if (n.kind == "final") {
      el.Subtype = 101;
    }
    if (n.parent && byId[n.parent]) {
      el.ParentID = byId[n.parent].ElementID;
    }
    if (n.stereo) {
      el.Stereotype = n.stereo;
    }
    if (n.notes) {
      el.Notes = n.notes;
    }
    el.Update();
    stats.elements++;
    if (n.attrs) {
      addAttributes(el, n.attrs);
    }
    if (n.ops) {
      addMethods(el, n.ops);
    }
    byId[n.id] = el;
    dobj = diagram.DiagramObjects.AddNew(n.pos, "");
    dobj.ElementID = el.ElementID;
    dobj.Update();
  }

  for (i = 0; i < d.edges.length; i++) {
    e = d.edges[i];
    src = byId[e.from];
    dst = byId[e.to];
    if (!src || !dst) {
      warn(d.title + ": conector con extremo desconocido (" + e.from + " -> " + e.to + ")");
      continue;
    }
    ctype = e.type || "Association";
    con = src.Connectors.AddNew(e.label || "", ctype);
    con.SupplierID = dst.ElementID;
    if (e.stereo) {
      con.Stereotype = e.stereo;
    }
    if (e.dir) {
      con.Direction = e.dir;
    }
    if (e.seq) {
      con.SequenceNo = e.seq;
    }
    con.Update();
    if (e.srcCard || e.dstCard || e.srcAgg || e.dstAgg) {
      if (e.srcCard) { con.ClientEnd.Cardinality = e.srcCard; }
      if (e.dstCard) { con.SupplierEnd.Cardinality = e.dstCard; }
      if (e.srcAgg) { con.ClientEnd.Aggregation = e.srcAgg; }
      if (e.dstAgg) { con.SupplierEnd.Aggregation = e.dstAgg; }
      con.ClientEnd.Update();
      con.SupplierEnd.Update();
    }
    src.Connectors.Refresh();
    stats.connectors++;
  }

  diagram.DiagramObjects.Refresh();
  if (d.type == "class" || d.type == "usecase") {
    try {
      Repository.GetProjectInterface().LayoutDiagramEx(diagram.DiagramGUID, 0, 4, 20, 20, true);
    } catch (ex) {
      // Si falla el autoacomodo queda la rejilla inicial.
    }
  }
  Repository.ReloadDiagram(diagram.DiagramID);
}

function main() {
  var root, top, i, d, t0 = new Date();
  if (Repository.Models.Count == 0) {
    Session.Prompt("Abre un proyecto de EA con al menos un modelo raiz.", 0);
    return;
  }
  root = Repository.Models.GetAt(0);
  for (i = 0; i < root.Packages.Count; i++) {
    if (root.Packages.GetAt(i).Name == SCRIPT_TITLE) {
      Session.Prompt("Ya existe el paquete '" + SCRIPT_TITLE + "'. Borralo (o usa un proyecto vacio) y vuelve a ejecutar.", 0);
      return;
    }
  }
  log("== " + SCRIPT_TITLE + ": " + DIAGRAMS.length + " diagramas ==");
  Repository.EnableUIUpdates = false;
  try {
    for (i = 0; i < DIAGRAMS.length; i++) {
      d = DIAGRAMS[i];
      d.path = [SCRIPT_TITLE].concat(d.path);
      buildDiagram(root, d);
      log((i + 1) + "/" + DIAGRAMS.length + "  " + d.title);
    }
  } catch (err) {
    log("ERROR: " + (err.message || err));
  }
  Repository.EnableUIUpdates = true;
  Repository.RefreshModelView(root.PackageID);
  log("Listo en " + Math.round((new Date() - t0) / 1000) + " s: " + stats.diagrams + " diagramas, " +
      stats.elements + " elementos, " + stats.connectors + " conectores, " + stats.warnings + " avisos.");
}

main();
