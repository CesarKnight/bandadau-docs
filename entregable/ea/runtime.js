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
