'use strict';

module.exports = function (AppUser) {


    /**
     * Register
     * => Se utente esiste -> invia nuovo codice via email
     * => Se utente NON esiste -> crea utente ed invia codice via email
     * 
     * Return:
     * token sessione per utilizzo API
     */
    AppUser.register = function (username, email, cb) {
        var tokenTimeToLive = 0; //in ms

        AppUser.findOne({
            where: {
                and: [
                    { username: username },
                    { email: email }
                ]
            }
        }, function (err, user) {
            // Errore in fase di ricerca utente (non capisco quando si possa verificare)
            if (err) {
                return cb(new Error(err.message), null);
            } else {
                if (user) {
                    // Utente esistente: invio email con nuovo codice, creo token e ritorno
                    var accessCode = makeid();
                    sendEmail(user, accessCode);
                    user.updateAttribute("password", accessCode, () => {
                        createAccessToken(user, (error, token) => {
                            let response = {
                                code: accessCode,
                                token: token
                            }
                            return cb(error, response);
                        });
                    })
                } else {
                    // Utente non esiste, lo creo
                    return appUserCreate(username, email, function (err, user, accessCode) {
                        if (err) {
                            return cb(new Error(err.message), null);
                        } else {
                            createAccessToken(user, (err, token) => {
                                let response = {
                                    code: accessCode,
                                    token: token
                                }
                                return cb(err, response);
                            });
                        }
                    });
                }
            }
        });
    };

    AppUser.remoteMethod('register', {
        accepts: [
            { arg: 'username', type: 'string', required: true },
            { arg: 'email', type: 'string', required: true }
        ],
        returns: { arg: 'credentials', type: 'object', root: true },
        description: "Custom user register"
    });

    /**
     * Login
     * => Se utente esiste -> invia nuovo codice via email
     * => Se utente NON esiste -> crea utente ed invia codice via email
     * 
     * Return:
     * token sessione per utilizzo API
     */
    AppUser.signin = function (username, email, cb) {
        var tokenTimeToLive = 0; //in ms
        AppUser.findOne({
            where: {
                and: [
                    { username: username },
                    { email: email }
                ]
            }
        }, function (err, user) {
            // Errore in fase di ricerca utente (non capisco quando si possa verificare)
            if (err) {
                return cb(new Error(err.message), null);
            } else {
                if (user) {
                    // Utente esistente: invio email con nuovo codice, creo token e ritorno
                    createAccessToken(user, (err, token) => {
                        return cb(err, { token: token });
                    });
                } else {
                    // Utente non esiste, lo creo
                    return appUserCreate(username, email, function (err, user, accessCode) {
                        if (err) {
                            return cb(new Error(err.message), null);
                        } else {
                            createAccessToken(user, (err, token) => {
                                let response = {
                                    code: accessCode,
                                    token: token
                                }
                                return cb(err, response);
                            });
                        }
                    });
                }
            }
        });
    };

    AppUser.remoteMethod('signin', {
        accepts: [
            { arg: 'username', type: 'string', required: true },
            { arg: 'email', type: 'string', required: true }
        ],
        returns: { arg: 'credentials', type: 'object', root: true },
        description: "Custom user login"
    });

    // Creazione utente ed invio email
    function appUserCreate(username, email, cb) {
        var accessCode = makeid();
        var credentials = {
            username: username,
            email: email,
            password: accessCode
        }
        AppUser.create(credentials, function (err, user) {
            if (err) {
                return cb(err, null);
            } else {
                if (user) {
                    // send email - async
                    sendEmail(credentials, accessCode);

                    return cb(null, user, accessCode);
                } else {
                    return cb(new Error("No User created"), null);
                }
            }
        });
    };

    // Generazione codice
    function makeid() {
        var text = '';
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    // creazione token accesso API
    function createAccessToken(user, cb) {
        user.createAccessToken(0, function (error, token) {
            return cb(error, token);
        });
    }

    // invio email
    function sendEmail(credentials, accessCode) {
        // WTF
        var from = AppUser.app.dataSources.Email.settings.transports[0].auth.user;
        // Email template
        var html = "<style>.element {display: inline-block;background-color: #aaaaaa;height: 150px;width: 150px;transform: skew(20deg);font-size: 20px;padding: 1px;color: white;margin-right: auto;margin-left: auto;animation: roll 3s infinite;animation-direction: alternate;}@keyframes roll {0% {transform: rotate(0);}100% {transform: rotate(360deg);}}body, html {height: 100%;}</style><h3>" + credentials.username + ", welcome to 1H1DPhoto !!</h3><p>Confirmation CODE:</p><div class=\"element\"><h1>" + accessCode + "</h1></div>"

        // send email using Email model of Loopback    
        AppUser.app.models.Email.send({
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
    }
}

