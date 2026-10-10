// Initial imports need explicit Sanity member names; figure values stay intact.
export function withFigureType(figures, type) {
  if (!Array.isArray(figures)) throw Error('Figures must be an array.');
  if (!['impactFact','projectImpactFact'].includes(type)) throw Error('Unknown figure member type.');
  return figures.map((figure,index)=>({...figure,_type:type,_key:figure._key||`fact-${index}`}));
}
