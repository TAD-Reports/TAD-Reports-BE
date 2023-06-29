const handleLogout = (req, res) => {
  // on client, also delete the access token
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);
  const refreshToken = cookies.jwt;

  console.log(this.db);
  const foundUser = this.db.users.find(
    (person) => person.refreshToken === refreshToken
  );
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.sendStatus(204);
  }

  const otherUsers = this.db.users.filter(
    (person) => person.refreshToken !== refreshToken
  );
  const currentUsers = { ...foundUser, refreshToken: "" };


  res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
};

module.exports = { handleLogout };
