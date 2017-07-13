'use strict';

module.exports = function(CustomUser) {
CustomUser.customLogin = function (username, cb) {
        var tokenTimeToLive = 0; //in ms
        CustomUser.findOne({
            where: {username: username}
        }, function (err, user) {
            if (err) {
                return cb(err, null);
            } else {
                if (user) {
                    user.createAccessToken(tokenTimeToLive, function (error, token) {
                        return cb(error, token);
                    });
                } else {
                    return cb(new Error("No User found"), null);
                }
            }
        });
    };

    CustomUser.remoteMethod('customLogin', {
        accepts: {arg: 'username', type: 'string', required: true},
        returns: {arg: 'credentials', type: 'object', root: true},
        description: "Custom login entry"
    });

};
