// Bandada U - 06 SAGA (7 diagramas)
var SCRIPT_TITLE = "Bandada U - 06 SAGA";
var DIAGRAMS = [{"type":"state","title":"SAGA Estados - SagaInstance (type = REGISTRATION)","path":["Estados"],"nodes":[{"id":"init:top","kind":"initial","name":"","pos":"l=20;r=50;t=-20;b=-50;"},{"id":"STARTED","kind":"state","name":"STARTED","pos":"l=290;r=480;t=-20;b=-80;"},{"id":"AWAITING_DEBIT","kind":"state","name":"AWAITING_DEBIT","pos":"l=560;r=750;t=-20;b=-80;"},{"id":"AWAITING_TICKET","kind":"state","name":"AWAITING_TICKET","pos":"l=20;r=210;t=-160;b=-220;"},{"id":"COMPENSATING","kind":"state","name":"COMPENSATING","pos":"l=290;r=480;t=-160;b=-220;"},{"id":"COMPLETED","kind":"state","name":"COMPLETED","pos":"l=560;r=750;t=-160;b=-220;"},{"id":"COMPENSATED","kind":"state","name":"COMPENSATED","pos":"l=20;r=210;t=-300;b=-360;"},{"id":"FAILED","kind":"state","name":"FAILED","pos":"l=290;r=480;t=-300;b=-360;"},{"id":"final:top","kind":"final","name":"","pos":"l=560;r=590;t=-300;b=-330;"}],"edges":[{"from":"init:top","to":"STARTED","type":"StateFlow","label":"POST registrations, seat reserved","dir":"Source -> Destination"},{"from":"STARTED","to":"AWAITING_DEBIT","type":"StateFlow","label":"priceCredits > 0, send debit-credits","dir":"Source -> Destination"},{"from":"STARTED","to":"AWAITING_TICKET","type":"StateFlow","label":"priceCredits = 0, send issue-ticket","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"AWAITING_TICKET","type":"StateFlow","label":"credits-debited, send issue-ticket","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"COMPENSATING","type":"StateFlow","label":"credits-debit-failed","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"COMPENSATING","type":"StateFlow","label":"deadline expired after 3 resends","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"COMPLETED","type":"StateFlow","label":"ticket-issued","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"COMPENSATING","type":"StateFlow","label":"ticket-issue-failed","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"COMPENSATING","type":"StateFlow","label":"deadline expired after 3 resends","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"COMPENSATED","type":"StateFlow","label":"all compensations confirmed","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"FAILED","type":"StateFlow","label":"compensation deadline exhausted","dir":"Source -> Destination"},{"from":"COMPLETED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"COMPENSATED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"FAILED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"}]},{"type":"state","title":"SAGA Estados - SagaInstance (type = CANCELLATION, UC-13)","path":["Estados"],"nodes":[{"id":"init:top","kind":"initial","name":"","pos":"l=20;r=50;t=-20;b=-50;"},{"id":"STARTED","kind":"state","name":"STARTED","pos":"l=290;r=480;t=-20;b=-80;"},{"id":"COMPENSATING","kind":"state","name":"COMPENSATING","pos":"l=560;r=750;t=-20;b=-80;"},{"id":"COMPLETED","kind":"state","name":"COMPLETED","pos":"l=20;r=210;t=-160;b=-220;"},{"id":"FAILED","kind":"state","name":"FAILED","pos":"l=290;r=480;t=-160;b=-220;"},{"id":"final:top","kind":"final","name":"","pos":"l=560;r=590;t=-160;b=-190;"}],"edges":[{"from":"init:top","to":"STARTED","type":"StateFlow","label":"POST cancel, registration CANCELLATION_PENDING","dir":"Source -> Destination"},{"from":"STARTED","to":"COMPENSATING","type":"StateFlow","label":"send void-ticket","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"COMPENSATING","type":"StateFlow","label":"ticket-voided, send refund-credits","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"COMPLETED","type":"StateFlow","label":"credits-refunded or free event, seat released","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"FAILED","type":"StateFlow","label":"ticket already used or deadline exhausted","dir":"Source -> Destination"},{"from":"COMPLETED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"FAILED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"}]},{"type":"state","title":"SAGA Estados - Registration","path":["Estados"],"nodes":[{"id":"init:top","kind":"initial","name":"","pos":"l=20;r=50;t=-20;b=-50;"},{"id":"PENDING","kind":"state","name":"PENDING","pos":"l=290;r=480;t=-20;b=-80;"},{"id":"CONFIRMED","kind":"state","name":"CONFIRMED","pos":"l=560;r=750;t=-20;b=-80;"},{"id":"FAILED","kind":"state","name":"FAILED","pos":"l=20;r=210;t=-160;b=-220;"},{"id":"CANCELLATION_PENDING","kind":"state","name":"CANCELLATION_PENDING","pos":"l=290;r=480;t=-160;b=-220;"},{"id":"CANCELLED","kind":"state","name":"CANCELLED","pos":"l=560;r=750;t=-160;b=-220;"},{"id":"final:top","kind":"final","name":"","pos":"l=20;r=50;t=-300;b=-330;"}],"edges":[{"from":"init:top","to":"PENDING","type":"StateFlow","label":"seat reserved","dir":"Source -> Destination"},{"from":"PENDING","to":"CONFIRMED","type":"StateFlow","label":"saga COMPLETED","dir":"Source -> Destination"},{"from":"PENDING","to":"FAILED","type":"StateFlow","label":"saga COMPENSATED or FAILED","dir":"Source -> Destination"},{"from":"CONFIRMED","to":"CANCELLATION_PENDING","type":"StateFlow","label":"user cancels","dir":"Source -> Destination"},{"from":"CANCELLATION_PENDING","to":"CANCELLED","type":"StateFlow","label":"cancellation saga COMPLETED","dir":"Source -> Destination"},{"from":"CANCELLATION_PENDING","to":"CONFIRMED","type":"StateFlow","label":"cancellation rejected, ticket USED","dir":"Source -> Destination"},{"from":"FAILED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"CANCELLED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"}]},{"type":"seq","title":"SAGA Secuencia - Secuencia \u2014 camino feliz (evento pagado)","path":["Secuencias"],"nodes":[{"id":"C","kind":"object","name":"App"},{"id":"EV","kind":"object","name":"events-service"},{"id":"DB","kind":"object","name":"events_db"},{"id":"MQ","kind":"object","name":"RabbitMQ"},{"id":"WA","kind":"object","name":"wallet-service"},{"id":"TI","kind":"object","name":"ticketing-service"}],"edges":[{"from":"C","to":"EV","type":"Sequence","label":"POST /events/{id}/registrations + Idempotency-Key","seq":1},{"from":"EV","to":"DB","type":"Sequence","label":"TX: reserveSeat, Registration PENDING, SagaInstance AWAITING_DEBIT, outbox debit-credits","seq":2},{"from":"EV","to":"C","type":"Sequence","label":"(retorno) 202 registrationId, PENDING","seq":3},{"from":"EV","to":"MQ","type":"Sequence","label":"relay publica bandada.wallet.cmd.debit-credits.v1","seq":4},{"from":"MQ","to":"WA","type":"Sequence","label":"wallet-service.commands","seq":5},{"from":"WA","to":"WA","type":"Sequence","label":"TX: inbox, LedgerEntry DEBIT operationRef DEBIT:regId, outbox","seq":6},{"from":"WA","to":"MQ","type":"Sequence","label":"bandada.wallet.credits-debited.v1","seq":7},{"from":"MQ","to":"EV","type":"Sequence","label":"events-service.saga-replies","seq":8},{"from":"EV","to":"DB","type":"Sequence","label":"TX: inbox, saga AWAITING_TICKET, outbox issue-ticket","seq":9},{"from":"EV","to":"MQ","type":"Sequence","label":"bandada.ticketing.cmd.issue-ticket.v1","seq":10},{"from":"MQ","to":"TI","type":"Sequence","label":"ticketing-service.commands","seq":11},{"from":"TI","to":"TI","type":"Sequence","label":"TransactWriteItems: inbox, Ticket ISSUED, outbox item","seq":12},{"from":"TI","to":"MQ","type":"Sequence","label":"bandada.ticketing.ticket-issued.v1","seq":13},{"from":"MQ","to":"EV","type":"Sequence","label":"events-service.saga-replies","seq":14},{"from":"EV","to":"DB","type":"Sequence","label":"TX: inbox, saga COMPLETED, Registration CONFIRMED, outbox registration.confirmed","seq":15},{"from":"EV","to":"MQ","type":"Sequence","label":"bandada.events.registration.confirmed.v1","seq":16},{"from":"C","to":"EV","type":"Sequence","label":"GET /registrations/{id} (polling)","seq":17},{"from":"EV","to":"C","type":"Sequence","label":"(retorno) 200 CONFIRMED, ticketId","seq":18}]},{"type":"seq","title":"SAGA Secuencia - Secuencia \u2014 fallo en ticketing con rollback (demo CHAOS_TICKETING_FAIL)","path":["Secuencias"],"nodes":[{"id":"EV","kind":"object","name":"events-service"},{"id":"MQ","kind":"object","name":"RabbitMQ"},{"id":"WA","kind":"object","name":"wallet-service"},{"id":"TI","kind":"object","name":"ticketing-service"},{"id":"note:1","kind":"note","name":"","notes":"saga AWAITING_TICKET, debited = true"}],"edges":[{"from":"note:1","to":"EV","type":"NoteLink"},{"from":"EV","to":"MQ","type":"Sequence","label":"cmd.issue-ticket (key sagaId:ISSUE_TICKET)","seq":1},{"from":"MQ","to":"TI","type":"Sequence","label":"issue-ticket","seq":2},{"from":"TI","to":"MQ","type":"Sequence","label":"ticket-issue-failed reason CHAOS_INJECTED","seq":3},{"from":"MQ","to":"EV","type":"Sequence","label":"ticket-issue-failed","seq":4},{"from":"EV","to":"EV","type":"Sequence","label":"saga COMPENSATING step REFUND_CREDITS","seq":5},{"from":"EV","to":"MQ","type":"Sequence","label":"cmd.refund-credits (key sagaId:REFUND_CREDITS)","seq":6},{"from":"MQ","to":"WA","type":"Sequence","label":"refund-credits","seq":7},{"from":"WA","to":"WA","type":"Sequence","label":"LedgerEntry REFUND operationRef REFUND:regId","seq":8},{"from":"WA","to":"MQ","type":"Sequence","label":"credits-refunded","seq":9},{"from":"MQ","to":"EV","type":"Sequence","label":"credits-refunded","seq":10},{"from":"EV","to":"EV","type":"Sequence","label":"TX: releaseSeat, Registration FAILED, saga COMPENSATED, outbox registration.failed","seq":11},{"from":"EV","to":"MQ","type":"Sequence","label":"bandada.events.registration.failed.v1","seq":12}]},{"type":"state","title":"UC-12 Estados - SagaInstance (type = REGISTRATION)","path":["Estados UC-12"],"nodes":[{"id":"COMPENSATING","kind":"state","name":"COMPENSATING","pos":"l=560;r=1270;t=-160;b=-386;"},{"id":"init:top","kind":"initial","name":"","pos":"l=20;r=50;t=-20;b=-50;"},{"id":"STARTED","kind":"state","name":"STARTED","pos":"l=290;r=480;t=-20;b=-80;"},{"id":"AWAITING_DEBIT","kind":"state","name":"AWAITING_DEBIT","pos":"l=560;r=750;t=-20;b=-80;"},{"id":"AWAITING_TICKET","kind":"state","name":"AWAITING_TICKET","pos":"l=20;r=210;t=-160;b=-220;"},{"id":"FAILED","kind":"state","name":"FAILED","pos":"l=290;r=480;t=-160;b=-220;"},{"id":"init:COMPENSATING","kind":"initial","name":"","pos":"l=590;r=620;t=-196;b=-226;","parent":"COMPENSATING"},{"id":"VOID_TICKET","kind":"state","name":"VOID_TICKET","pos":"l=820;r=1010;t=-196;b=-256;","parent":"COMPENSATING"},{"id":"REFUND_CREDITS","kind":"state","name":"REFUND_CREDITS","pos":"l=1050;r=1240;t=-196;b=-256;","parent":"COMPENSATING"},{"id":"RELEASE_SEAT","kind":"state","name":"RELEASE_SEAT","pos":"l=590;r=780;t=-296;b=-356;","parent":"COMPENSATING"},{"id":"final:COMPENSATING","kind":"final","name":"","pos":"l=820;r=850;t=-296;b=-326;","parent":"COMPENSATING"},{"id":"COMPLETED","kind":"state","name":"COMPLETED","pos":"l=20;r=210;t=-466;b=-526;"},{"id":"COMPENSATED","kind":"state","name":"COMPENSATED","pos":"l=290;r=480;t=-466;b=-526;"},{"id":"final:top","kind":"final","name":"","pos":"l=560;r=590;t=-466;b=-496;"}],"edges":[{"from":"init:top","to":"STARTED","type":"StateFlow","label":"admisi\u00f3n (reserva de cupo local)","dir":"Source -> Destination"},{"from":"STARTED","to":"AWAITING_DEBIT","type":"StateFlow","label":"precio mayor que 0, emite debit-credits","dir":"Source -> Destination"},{"from":"STARTED","to":"AWAITING_TICKET","type":"StateFlow","label":"evento gratuito, emite issue-ticket","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"AWAITING_DEBIT","type":"StateFlow","label":"deadline vencido y attempts menor que 3, reenv\u00eda","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"AWAITING_TICKET","type":"StateFlow","label":"credits-debited, emite issue-ticket","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"FAILED","type":"StateFlow","label":"credits-debit-failed, libera cupo","dir":"Source -> Destination"},{"from":"AWAITING_DEBIT","to":"COMPENSATING","type":"StateFlow","label":"reintentos agotados, emite refund-credits","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"AWAITING_TICKET","type":"StateFlow","label":"deadline vencido y attempts menor que 3, reenv\u00eda","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"COMPLETED","type":"StateFlow","label":"ticket-issued, confirma inscripci\u00f3n","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"COMPENSATING","type":"StateFlow","label":"ticket-issue-failed o reintentos agotados","dir":"Source -> Destination"},{"from":"AWAITING_TICKET","to":"FAILED","type":"StateFlow","label":"ticket-issue-failed en evento gratuito, libera cupo","dir":"Source -> Destination"},{"from":"init:COMPENSATING","to":"VOID_TICKET","type":"StateFlow","label":"solo por timeout del paso 3","dir":"Source -> Destination"},{"from":"init:COMPENSATING","to":"REFUND_CREDITS","type":"StateFlow","label":"fallo de ticket o timeout del paso 2","dir":"Source -> Destination"},{"from":"VOID_TICKET","to":"REFUND_CREDITS","type":"StateFlow","label":"ticket-voided y precio mayor que 0","dir":"Source -> Destination"},{"from":"VOID_TICKET","to":"RELEASE_SEAT","type":"StateFlow","label":"ticket-voided y evento gratuito","dir":"Source -> Destination"},{"from":"REFUND_CREDITS","to":"RELEASE_SEAT","type":"StateFlow","label":"credits-refunded","dir":"Source -> Destination"},{"from":"RELEASE_SEAT","to":"final:COMPENSATING","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"COMPENSATING","to":"COMPENSATED","type":"StateFlow","label":"cupo liberado, emite registration.failed","dir":"Source -> Destination"},{"from":"COMPLETED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"FAILED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"COMPENSATED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"}]},{"type":"state","title":"UC-12 Estados - Registration","path":["Estados UC-12"],"nodes":[{"id":"init:top","kind":"initial","name":"","pos":"l=20;r=50;t=-20;b=-50;"},{"id":"PENDING","kind":"state","name":"PENDING","pos":"l=290;r=480;t=-20;b=-80;"},{"id":"CONFIRMED","kind":"state","name":"CONFIRMED","pos":"l=560;r=750;t=-20;b=-80;"},{"id":"FAILED","kind":"state","name":"FAILED","pos":"l=20;r=210;t=-160;b=-220;"},{"id":"CANCELLATION_PENDING","kind":"state","name":"CANCELLATION_PENDING","pos":"l=290;r=480;t=-160;b=-220;"},{"id":"CANCELLED","kind":"state","name":"CANCELLED","pos":"l=560;r=750;t=-160;b=-220;"},{"id":"final:top","kind":"final","name":"","pos":"l=20;r=50;t=-300;b=-330;"}],"edges":[{"from":"init:top","to":"PENDING","type":"StateFlow","label":"registerToEvent (202)","dir":"Source -> Destination"},{"from":"PENDING","to":"CONFIRMED","type":"StateFlow","label":"SAGA COMPLETED (ticketId)","dir":"Source -> Destination"},{"from":"PENDING","to":"FAILED","type":"StateFlow","label":"INSUFFICIENT_FUNDS, WALLET_NOT_FOUND, TICKET_ISSUE_FAILED o TIMEOUT","dir":"Source -> Destination"},{"from":"CONFIRMED","to":"CANCELLATION_PENDING","type":"StateFlow","label":"cancelRegistration (UC-13)","dir":"Source -> Destination"},{"from":"CANCELLATION_PENDING","to":"CANCELLED","type":"StateFlow","label":"SAGA CANCELLATION completada (UC-13)","dir":"Source -> Destination"},{"from":"FAILED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"},{"from":"CANCELLED","to":"final:top","type":"StateFlow","label":"","dir":"Source -> Destination"}]}];

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
