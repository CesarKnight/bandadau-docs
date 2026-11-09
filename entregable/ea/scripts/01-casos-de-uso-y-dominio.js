// Bandada U - 01 Casos de uso y dominio (2 diagramas)
var SCRIPT_TITLE = "Bandada U - 01 Casos de uso y dominio";
var DIAGRAMS = [{"type":"usecase","title":"Diagrama general de casos de uso","path":["Casos de uso"],"nodes":[{"id":"V","kind":"actor","name":"Visitante"},{"id":"S","kind":"actor","name":"Estudiante"},{"id":"O","kind":"actor","name":"Organizador"},{"id":"M","kind":"actor","name":"Moderador"},{"id":"A","kind":"actor","name":"Administrador"},{"id":"P","kind":"actor","name":"Portero"},{"id":"X","kind":"actor","name":"Cliente MCP"},{"id":"R","kind":"actor","name":"Reloj"},{"id":"UC01","kind":"usecase","name":"UC-01 Registrarse","group":"Identidad"},{"id":"UC02","kind":"usecase","name":"UC-02 Iniciar sesi\u00f3n","group":"Identidad"},{"id":"UC03","kind":"usecase","name":"UC-03 Ir al panel sin re-login","group":"Identidad"},{"id":"UC04","kind":"usecase","name":"UC-04 Gestionar perfil y preferencias","group":"Social"},{"id":"UC05","kind":"usecase","name":"UC-05 Publicar contenido","group":"Social"},{"id":"UC06","kind":"usecase","name":"UC-06 Ver feed","group":"Social"},{"id":"UC07","kind":"usecase","name":"UC-07 Comentar y reaccionar","group":"Social"},{"id":"UC08","kind":"usecase","name":"UC-08 Seguir estudiantes","group":"Social"},{"id":"UC09","kind":"usecase","name":"UC-09 Participar en grupo","group":"Social"},{"id":"UC10","kind":"usecase","name":"UC-10 Denunciar contenido","group":"Social"},{"id":"UC11","kind":"usecase","name":"UC-11 Publicar evento","group":"Eventos"},{"id":"UC12","kind":"usecase","name":"UC-12 Inscribirse a evento pagado","group":"Eventos"},{"id":"UC13","kind":"usecase","name":"UC-13 Cancelar inscripci\u00f3n","group":"Eventos"},{"id":"UC14","kind":"usecase","name":"UC-14 Validar entrada","group":"Eventos"},{"id":"UC15","kind":"usecase","name":"UC-15 Recargar cr\u00e9ditos","group":"Billetera"},{"id":"UC16","kind":"usecase","name":"UC-16 Consultar movimientos","group":"Billetera"},{"id":"UC17","kind":"usecase","name":"UC-17 Usar asistente offline","group":"IA local"},{"id":"UC18","kind":"usecase","name":"UC-18 Moderar contenido","group":"Admin"},{"id":"UC19","kind":"usecase","name":"UC-19 Pedir reporte generativo","group":"Admin"},{"id":"UC20","kind":"usecase","name":"UC-20 Monitorear plataforma","group":"Admin"},{"id":"UC21","kind":"usecase","name":"UC-21 Gestionar usuarios","group":"Admin"},{"id":"UC22","kind":"usecase","name":"UC-22 Consultar v\u00eda MCP","group":"Admin"},{"id":"UC23","kind":"usecase","name":"UC-23 Recibir recordatorios y resumen","group":"Automatizaci\u00f3n"},{"id":"UC24","kind":"usecase","name":"UC-24 Recibir notificaciones","group":"Automatizaci\u00f3n"}],"edges":[{"from":"V","to":"UC01","type":"Association"},{"from":"S","to":"UC02","type":"Association"},{"from":"S","to":"UC04","type":"Association"},{"from":"S","to":"UC05","type":"Association"},{"from":"S","to":"UC06","type":"Association"},{"from":"S","to":"UC07","type":"Association"},{"from":"S","to":"UC08","type":"Association"},{"from":"S","to":"UC09","type":"Association"},{"from":"S","to":"UC10","type":"Association"},{"from":"S","to":"UC12","type":"Association"},{"from":"S","to":"UC13","type":"Association"},{"from":"S","to":"UC15","type":"Association"},{"from":"S","to":"UC16","type":"Association"},{"from":"S","to":"UC17","type":"Association"},{"from":"S","to":"UC24","type":"Association"},{"from":"O","to":"UC11","type":"Association"},{"from":"P","to":"UC14","type":"Association"},{"from":"A","to":"UC03","type":"Association"},{"from":"A","to":"UC19","type":"Association"},{"from":"A","to":"UC21","type":"Association"},{"from":"M","to":"UC18","type":"Association"},{"from":"R","to":"UC20","type":"Association"},{"from":"R","to":"UC23","type":"Association"},{"from":"X","to":"UC22","type":"Association"}]},{"type":"class","title":"Modelo de dominio (vista global)","path":["Modelo de dominio"],"nodes":[{"id":"University","kind":"class","name":"University","attrs":[{"name":"id","type":"","vis":""},{"name":"name","type":"","vis":""},{"name":"allowedDomains[]","type":"","vis":""}],"group":"Identidad"},{"id":"User","kind":"class","name":"User","attrs":[{"name":"id","type":"","vis":""},{"name":"email","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"roles[]","type":"","vis":""},{"name":"emailVerifiedAt","type":"","vis":""},{"name":"locale","type":"","vis":""},{"name":"theme","type":"","vis":""}],"group":"Identidad"},{"id":"Credential","kind":"class","name":"Credential","attrs":[{"name":"passwordHash","type":"","vis":""}],"group":"Identidad"},{"id":"RefreshToken","kind":"class","name":"RefreshToken","attrs":[{"name":"tokenHash","type":"","vis":""},{"name":"expiresAt","type":"","vis":""},{"name":"revokedAt","type":"","vis":""}],"group":"Identidad"},{"id":"EmailVerification","kind":"class","name":"EmailVerification","attrs":[{"name":"code","type":"","vis":""},{"name":"expiresAt","type":"","vis":""},{"name":"attempts","type":"","vis":""}],"group":"Identidad"},{"id":"HandoffCode","kind":"class","name":"HandoffCode","attrs":[{"name":"codeHash","type":"","vis":""},{"name":"targetApp","type":"","vis":""},{"name":"expiresAt","type":"","vis":""},{"name":"usedAt","type":"","vis":""}],"group":"Identidad"},{"id":"Profile","kind":"class","name":"Profile","attrs":[{"name":"userId","type":"","vis":""},{"name":"displayName","type":"","vis":""},{"name":"career","type":"","vis":""},{"name":"semester","type":"","vis":""},{"name":"bio","type":"","vis":""},{"name":"interests[]","type":"","vis":""},{"name":"avatarMediaId","type":"","vis":""}],"group":"Social"},{"id":"Post","kind":"class","name":"Post","attrs":[{"name":"id","type":"","vis":""},{"name":"authorId","type":"","vis":""},{"name":"text","type":"","vis":""},{"name":"hashtags[]","type":"","vis":""},{"name":"visibility","type":"","vis":""},{"name":"groupId","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"clientId","type":"","vis":""}],"group":"Social"},{"id":"Comment","kind":"class","name":"Comment","attrs":[{"name":"id","type":"","vis":""},{"name":"postId","type":"","vis":""},{"name":"authorId","type":"","vis":""},{"name":"text","type":"","vis":""}],"group":"Social"},{"id":"Reaction","kind":"class","name":"Reaction","attrs":[{"name":"postId","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"type","type":"","vis":""}],"group":"Social"},{"id":"Follow","kind":"class","name":"Follow","attrs":[{"name":"followerId","type":"","vis":""},{"name":"followeeId","type":"","vis":""}],"group":"Social"},{"id":"Group","kind":"class","name":"Group","attrs":[{"name":"id","type":"","vis":""},{"name":"name","type":"","vis":""},{"name":"subject","type":"","vis":""},{"name":"privacy","type":"","vis":""}],"group":"Social"},{"id":"GroupMembership","kind":"class","name":"GroupMembership","attrs":[{"name":"groupId","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"role","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Social"},{"id":"ContentReport","kind":"class","name":"ContentReport","attrs":[{"name":"id","type":"","vis":""},{"name":"targetType","type":"","vis":""},{"name":"targetId","type":"","vis":""},{"name":"reporterId","type":"","vis":""},{"name":"reason","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Social"},{"id":"MediaAsset","kind":"class","name":"MediaAsset","attrs":[{"name":"id","type":"","vis":""},{"name":"ownerId","type":"","vis":""},{"name":"kind","type":"","vis":""},{"name":"storageKey","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"ocrText","type":"","vis":""},{"name":"tags[]","type":"","vis":""}],"group":"Media"},{"id":"ModerationResult","kind":"class","name":"ModerationResult","attrs":[{"name":"assetId","type":"","vis":""},{"name":"labels","type":"","vis":""},{"name":"scores","type":"","vis":""},{"name":"decision","type":"","vis":""},{"name":"modelVersion","type":"","vis":""}],"group":"Media"},{"id":"Event","kind":"class","name":"Event","attrs":[{"name":"id","type":"","vis":""},{"name":"organizerId","type":"","vis":""},{"name":"title","type":"","vis":""},{"name":"startsAt","type":"","vis":""},{"name":"venue","type":"","vis":""},{"name":"capacity","type":"","vis":""},{"name":"seatsTaken","type":"","vis":""},{"name":"priceCredits","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Eventos"},{"id":"Registration","kind":"class","name":"Registration","attrs":[{"name":"id","type":"","vis":""},{"name":"eventId","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"failureReason","type":"","vis":""}],"group":"Eventos"},{"id":"SagaInstance","kind":"class","name":"SagaInstance","attrs":[{"name":"id","type":"","vis":""},{"name":"registrationId","type":"","vis":""},{"name":"type","type":"","vis":""},{"name":"step","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"deadlineAt","type":"","vis":""}],"group":"Eventos"},{"id":"Wallet","kind":"class","name":"Wallet","attrs":[{"name":"userId","type":"","vis":""},{"name":"balanceCredits","type":"","vis":""},{"name":"version","type":"","vis":""}],"group":"Billetera"},{"id":"LedgerEntry","kind":"class","name":"LedgerEntry","attrs":[{"name":"id","type":"","vis":""},{"name":"walletId","type":"","vis":""},{"name":"type","type":"","vis":""},{"name":"amountCredits","type":"","vis":""},{"name":"operationRef","type":"","vis":""}],"group":"Billetera"},{"id":"TopUp","kind":"class","name":"TopUp","attrs":[{"name":"id","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"package","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"gatewayRef","type":"","vis":""}],"group":"Billetera"},{"id":"Ticket","kind":"class","name":"Ticket","attrs":[{"name":"id","type":"","vis":""},{"name":"registrationId","type":"","vis":""},{"name":"eventId","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"qrPayload","type":"","vis":""},{"name":"status","type":"","vis":""},{"name":"usedAt","type":"","vis":""}],"group":"Entradas"},{"id":"Notification","kind":"class","name":"Notification","attrs":[{"name":"id","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"type","type":"","vis":""},{"name":"title","type":"","vis":""},{"name":"body","type":"","vis":""},{"name":"readAt","type":"","vis":""}],"group":"Notificaciones"},{"id":"DeviceToken","kind":"class","name":"DeviceToken","attrs":[{"name":"token","type":"","vis":""},{"name":"userId","type":"","vis":""},{"name":"platform","type":"","vis":""}],"group":"Notificaciones"},{"id":"NotificationPreference","kind":"class","name":"NotificationPreference","attrs":[{"name":"userId","type":"","vis":""},{"name":"channels","type":"","vis":""}],"group":"Notificaciones"},{"id":"GeneratedReport","kind":"class","name":"GeneratedReport","attrs":[{"name":"id","type":"","vis":""},{"name":"question","type":"","vis":""},{"name":"markdown","type":"","vis":""},{"name":"dataset","type":"","vis":""},{"name":"audioKey","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Insights"},{"id":"AgentRun","kind":"class","name":"AgentRun","attrs":[{"name":"id","type":"","vis":""},{"name":"agent","type":"","vis":""},{"name":"steps","type":"","vis":""},{"name":"toolsUsed","type":"","vis":""},{"name":"tokens","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Insights"},{"id":"Alert","kind":"class","name":"Alert","attrs":[{"name":"id","type":"","vis":""},{"name":"severity","type":"","vis":""},{"name":"kind","type":"","vis":""},{"name":"message","type":"","vis":""},{"name":"status","type":"","vis":""}],"group":"Insights"},{"id":"MetricPoint","kind":"class","name":"MetricPoint","attrs":[{"name":"name","type":"","vis":""},{"name":"date","type":"","vis":""},{"name":"value","type":"","vis":""}],"group":"Insights"}],"edges":[{"label":"","from":"University","to":"User","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"User","to":"Credential","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"1"},{"label":"","from":"User","to":"RefreshToken","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"User","to":"HandoffCode","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"User","to":"EmailVerification","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"userId","from":"Profile","to":"User","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"Post","to":"Comment","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"Post","to":"Reaction","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"mediaIds","from":"Post","to":"MediaAsset","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"Group","to":"GroupMembership","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"groupId","from":"Post","to":"Group","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"ContentReport","to":"Post","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"MediaAsset","to":"ModerationResult","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"Event","to":"Registration","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"Registration","to":"SagaInstance","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"1"},{"label":"","from":"Wallet","to":"LedgerEntry","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"Wallet","to":"TopUp","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"operationRef","from":"LedgerEntry","to":"Registration","type":"Dependency","dir":"Source -> Destination"},{"label":"registrationId","from":"Ticket","to":"Registration","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"Notification","to":"User","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"DeviceToken","to":"User","type":"Dependency","dir":"Source -> Destination"},{"label":"","from":"AgentRun","to":"Alert","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"*"},{"label":"","from":"AgentRun","to":"GeneratedReport","type":"Association","dir":"Source -> Destination","srcCard":"1","dstCard":"0..1"}]}];

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

// En robustez, boundary/control/entity son objetos UML con el perfil EAUML,
// no los tipos nativos Boundary/Control/Entity de EA (que se dibujan como rectangulos).
var ROBUST_STEREOTYPE = {
  boundary: "EAUML::boundary",
  control: "EAUML::control",
  entity: "EAUML::entity"
};

function eaElementType(d, n) {
  if (d.type == "robust" && ROBUST_STEREOTYPE[n.kind]) {
    return "Object";
  }
  return EA_TYPE_BY_KIND[n.kind] || "Class";
}

function eaStereotype(d, n) {
  if (n.stereo) {
    return n.stereo;
  }
  if (d.type == "robust" && ROBUST_STEREOTYPE[n.kind]) {
    return ROBUST_STEREOTYPE[n.kind];
  }
  return "";
}

function setElementStereotype(el, stereo) {
  var parts;
  if (!stereo) {
    return;
  }
  parts = stereo.split("::");
  if (parts.length > 1) {
    // Stereotype guarda el nombre corto; StereotypeEx, el perfil completo.
    el.Stereotype = parts[parts.length - 1];
    el.StereotypeEx = stereo;
  } else {
    el.Stereotype = stereo;
  }
}

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
  // Tamano de los simbolos de robustez (ajustar aqui si quedan grandes/pequenos).
  var ROBUST_BOX = { w: 50, h: 60, row: 80 };
  for (i = 0; i < d.nodes.length; i++) {
    n = d.nodes[i];
    w = 150;
    h = 60;
    if (d.type == "robust") {
      w = ROBUST_BOX.w;
      h = ROBUST_BOX.h;
      k = n.kind;
      counters[k] = (counters[k] || 0) + 1;
      x = colX[k] || 20;
      y = 20 + (counters[k] - 1) * ROBUST_BOX.row;
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
    el = pk.Elements.AddNew(n.name, eaElementType(d, n));
    if (n.kind == "initial") {
      el.Subtype = 100;
    }
    if (n.kind == "final") {
      el.Subtype = 101;
    }
    if (n.parent && byId[n.parent]) {
      el.ParentID = byId[n.parent].ElementID;
    }
    setElementStereotype(el, eaStereotype(d, n));
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
