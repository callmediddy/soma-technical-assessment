export interface TodoDependencyRow {
  id: number;
  dependentId: number;
  dependencyId: number;
}

export interface TodoWithRelations {
  id: number;
  title: string;
  createdAt: string;
  dueDate: string | null;
  imageUrl: string | null;
  dependencies: (TodoDependencyRow & { dependency: TodoWithRelations })[];
  dependents: (TodoDependencyRow & { dependent: TodoWithRelations })[];
}

export interface TodoWithMeta extends TodoWithRelations {
  earliestStart: Date;
  isCritical: boolean;
}
