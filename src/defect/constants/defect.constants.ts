export const defectOwnerSelect = {
  id: true,
  email: true,
  name: true,
};

export const defectInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
  assignee: {
    select: defectOwnerSelect,
  },
  reporter: {
    select: defectOwnerSelect,
  },
};