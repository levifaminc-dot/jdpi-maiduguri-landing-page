// Validate raw Content Lake data as well as projected website values. Sanity's
// document validation alone can miss unknown fields and incompatible array types.
export function structuralIssues(documents, schema) {
  const types = new Map(schema.map(type => [type.name, type]));
  const ids = new Set(documents.map(doc => doc._id));
  const issues = [];
  function resolve(node) {
    while (node?.type === 'inline' || node?.type === 'type') {
      node = node.type === 'inline' ? types.get(node.name) : node.value;
    }
    return node;
  }
  function check(value, node, location) {
    if (!node) return [`${location}: missing schema definition`];
    if (node.type === 'inline') {
      const resolved = types.get(node.name);
      return check(value, resolved?.value || resolved, location);
    }
    if (node.type === 'type') return check(value, node.value, location);
    if (node.type === 'unknown') return [];
    if (node.type === 'union') {
      const alternatives = node.of.map(candidate => check(value, candidate, location));
      return alternatives.some(result => result.length === 0) ? [] : alternatives.sort((a,b) => a.length-b.length)[0];
    }
    if (node.type === 'array') {
      if (!Array.isArray(value)) return [`${location}: expected array`];
      const found = [], keys = new Set();
      value.forEach((item, index) => {
        const at = `${location}[${index}]`;
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if (typeof item._key !== 'string' || !item._key) found.push(`${at}: missing array key`);
          else if (keys.has(item._key)) found.push(`${at}: duplicate array key`);
          else keys.add(item._key);
        }
        found.push(...check(item, node.of, at));
      });
      return found;
    }
    if (node.type === 'object' || node.type === 'document') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${location}: expected object`];
      const rest=resolve(node.rest);
      const fields = {...rest?.attributes, ...node.attributes}, found = [];
      for (const [name, field] of Object.entries(fields)) {
        if (value[name] == null) {
          if (field.optional === false || name === '_type' || name === '_key') found.push(`${location}.${name}: missing required field`);
        } else found.push(...check(value[name], field.value, `${location}.${name}`));
      }
      for (const name of Object.keys(value)) if (!(name in fields) && !(node.type==='document'&&name==='_system')) found.push(`${location}.${name}: unknown field`);
      if ((node.dereferencesTo||rest?.dereferencesTo) && typeof value._ref === 'string' && !value._weak && !ids.has(value._ref)) found.push(`${location}: missing referenced document`);
      return found;
    }
    if (typeof value !== node.type) return [`${location}: expected ${node.type}`];
    if ('value' in node && value !== node.value) return [`${location}: incompatible saved type or option`];
    return [];
  }
  for (const doc of documents) {
    // Assets have additional platform-managed metadata, not editorial fields.
    if (doc._type?.startsWith('sanity.')) continue;
    const definition = types.get(doc._type);
    if (!definition || definition.type !== 'document') issues.push(`${doc._id}: unknown document type`);
    else issues.push(...check(doc, definition, doc._id));
  }
  return issues;
}
