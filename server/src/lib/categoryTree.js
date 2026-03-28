/**
 * Build maps for category hierarchy: parent -> children, id -> row.
 */
export function buildCategoryMaps(rows) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const children = new Map();
  for (const r of rows) {
    const pid = r.parent_id;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid).push(r);
  }
  return { byId, children };
}

/** Ordered list of category ids from `categoryId` up to root (inclusive). */
export function ancestorIdsFromDbRows(rows, categoryId) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const chain = [];
  let cur = categoryId;
  const seen = new Set();
  while (cur != null && byId.has(cur)) {
    if (seen.has(cur)) break;
    seen.add(cur);
    chain.push(cur);
    cur = byId.get(cur).parent_id;
  }
  return chain;
}

/** All descendant category ids of `rootId` (including root). */
export function descendantIds(childrenMap, rootId) {
  const out = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    out.push(id);
    const kids = childrenMap.get(id) || [];
    for (const k of kids) stack.push(k.id);
  }
  return out;
}

export function rowsToTree(rows) {
  const { children } = buildCategoryMaps(rows);
  function node(id) {
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    const kids = (children.get(id) || []).map((c) => node(c.id)).filter(Boolean);
    return { id: row.id, parent_id: row.parent_id, name: row.name, children: kids };
  }
  const roots = rows.filter((r) => r.parent_id == null).map((r) => node(r.id));
  return roots;
}
