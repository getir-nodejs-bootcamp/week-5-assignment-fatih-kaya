const hs = require("http-status");
const { passwordToHash, generateJWTAccessToken, generateJWTRefreshToken } = require("../scripts/utils/helper");
const eventEmitter = require("../scripts/events/eventEmitter");
const uuid = require("uuid");
const UserService = require("../services/UserService");
const ApiError = require("../errors/ApiError");

class UserController {
  index(req, res, next) {
    UserService.list()
      .then((userList) => {
        if (!userList) return next(new ApiError("User lists are not fetched", hs.NOT_FOUND));
        res.status(hs.OK).send(userList);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  create(req, res, next) {
    req.body.password = passwordToHash(req.body.password);
    UserService.create(req.body)
      .then((createdUser) => {
        if (!createdUser) return next(new ApiError("User is not created", hs.NOT_FOUND));
        res.status(hs.OK).send(createdUser);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  login(req, res, next) {
    req.body.password = passwordToHash(req.body.password);
    UserService.findOne(req.body)
      .then((user) => {
        if (!user) return next(new ApiError("User is not found", hs.NOT_FOUND));
        user = {
          ...user.toObject(),
          tokens: {
            access_token: generateJWTAccessToken(user),
            refresh_token: generateJWTRefreshToken(user),
          },
        };
        delete user.password;
        res.status(hs.OK).send(user);
      })
      .catch((e) => next(new ApiError(e?.message)));
  }
  resetPassword(req, res) {
    const newPassword = uuid.v4()?.split("-")[0] || `glsn-usr-${new Date().getTime()}`;
    UserService.updateWhere({ email: req.body.email }, { password: passwordToHash(newPassword) }).then((fetchedUser) => {
      if (!fetchedUser) return next(new ApiError("User is not found", hs.NOT_FOUND));

      eventEmitter.emit("send_mail", {
        to: req.body.email,
        subject: "Şifre Resetleme",
        html: `<b>${newPassword}</b>`,
      });

      res.status(200).send({
        message: "Şifrenizin Sistemde kayıtlı e-posta adresinize gönderilmiştir.",
      });
    });
  }
}

module.exports = new UserController();
