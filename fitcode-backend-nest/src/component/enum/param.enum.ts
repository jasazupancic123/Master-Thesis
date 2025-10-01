export enum ParamType {
  VolWorkSets = 'volWorkSets', // set
  VolWork1 = 'vol1', // rep, time, dist
  VolWork2 = 'vol2',
  IntWork1 = 'int1', // bw, kg, rm, tempo, eff, mass, hrmax
  IntWork2 = 'int2',
  VolRec1 = 'volRec', // rec
  IntRec1 = 'intRec', // MAS, eff
}

export enum VolWorkSetType {
  Set = 'set',
}

export enum VolType {
  Rep = 'rep',
  Time = 'time',
  Dist = 'dist',
}

export enum IntType {
  Kg = 'kg',
  Bw = 'bw',
  Rm = 'rm',
  Tempo = 'tempo',
  Eff = 'eff',
  Mas = 'mas',
  Hrmax = 'hrmax',
  VBT = 'vbt',
}

export enum LoadType {
  Kg = 'kg',
  Bw = 'bw',
  Rm = 'rm',
}
