export type BaseEntity = IdEntity & TimestampEntity;

export type IdEntity = { id: string };

export type TimestampEntity = { createdAt: Date; updatedAt: Date };

export type ColorEntity = { color?: string };
