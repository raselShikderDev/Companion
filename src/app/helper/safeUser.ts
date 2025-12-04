const safeUser = (user: any) => {
  if (!user) return null;

  delete user.password;

  if (user.explorers) {
    user.explorers.forEach((e: any) => {
      delete e.user?.password;
    });
  }

  if (user.admins) {
    user.admins.forEach((a: any) => {
      delete a.user?.password;
    });
  }

  return user;
};
