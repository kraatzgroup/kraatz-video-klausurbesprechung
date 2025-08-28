export const legalAreas = {
  'Zivilrecht': [
    'BGB AT',
    'Schuldrecht AT',
    'Schuldrecht BT',
    'Mobiliarsachenrecht',
    'Immobiliarsachenrecht',
    'Familienrecht',
    'Erbrecht',
    'Kaufrecht',
    'Mietrecht',
    'ZPO'
  ],
  'Strafrecht': [
    'Strafrecht AT',
    'Strafrecht BT Vermögensdelikte',
    'Strafrecht BT Nichtvermögensdelikte',
    'StPO'
  ],
  'Öffentliches Recht': [
    'Staatsorganisationsrecht',
    'Grundrechte',
    'Verwaltungsrecht AT',
    'Baurecht',
    'Kommunalrecht',
    'Polizei- und Ordnungsrecht',
    'Europarecht',
    'Staatshaftungsrecht'
  ]
}

export const getLegalAreaOptions = () => Object.keys(legalAreas)

export const getSubAreaOptions = (legalArea: string) => {
  return legalAreas[legalArea as keyof typeof legalAreas] || []
}
