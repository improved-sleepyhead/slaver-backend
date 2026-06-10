export const commentAuthorSelect = {
    id: true,
    email: true,
    name: true,
};

export const commentSelect = {
    id: true,
    content: true,
    authorId: true,
    defectId: true,
    createdAt: true,
    author: {
      select: commentAuthorSelect,
    },
};