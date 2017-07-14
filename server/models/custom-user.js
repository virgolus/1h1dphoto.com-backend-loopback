'use strict';

module.exports = function (CustomUser) {

    CustomUser.customLogin = function (username, cb) {
        var tokenTimeToLive = 0; //in ms
        CustomUser.findOne({
            where: { username: username }
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
        accepts: { arg: 'username', type: 'string', required: true },
        returns: { arg: 'credentials', type: 'object', root: true },
        description: "Custom user login"
    });

    CustomUser.customCreate = function (username, email, cb) {
        var credentials = {
            username: username,
            email: email,
            password: makeid()
        }
        CustomUser.create(credentials, function (err, user) {
            if (err) {
                return cb(err, null);
            } else {
                if (user) {

                    // WTF
                    var from = CustomUser.app.dataSources.Email.settings.transports[0].auth.user;

                    var html = "<style>.element {display: inline-block;background-color: #aaaaaa;height: 150px;width: 150px;transform: skew(20deg);font-size: 20px;padding: 1px;color: white;margin-right: auto;margin-left: auto;animation: roll 3s infinite;animation-direction: alternate;}@keyframes roll {0% {transform: rotate(0);}100% {transform: rotate(360deg);}}body, html {height: 100%;}</style><h3>"+ credentials.username +", welcome to 1H1DPhoto !!</h3><p>Confirmation CODE:</p><div class=\"element\"><h1>"+ credentials.password+"</h1></div>"

                    // send email using Email model of Loopback    
                    CustomUser.app.models.Email.send({
                        to: credentials.email,
                        from: from,
                        subject: 'Your custom email subject here',
                        html: html
                    }, function (err, mail) {
                        if (err) {
                            console.log('ERROR - email not sent!');
                        } else {
                            console.log('email sent!');
                        }
                    });

                    return cb(null, user);

                } else {
                    return cb(new Error("No User found"), null);
                }
            }
        });
    };

    CustomUser.remoteMethod('customCreate', {
        accepts: [
            { arg: 'username', type: 'string', required: true },
            { arg: 'email', type: 'string', required: true }
        ],
        returns: { arg: 'credentials', type: 'object', root: true },
        http: { verb: 'post' },
        description: "Custom user create"
    });

    function makeid() {
        var text = '';
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}

