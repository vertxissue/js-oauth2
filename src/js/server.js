var Router = require("vertx-web-js/router");
var OAuth2Auth = require("vertx-auth-oauth2-js/o_auth2_auth");

var router = Router.router(vertx);
var credentials = {
    "clientID" : "ad2b2d08f82c84629592",
    "clientSecret" : "4ce9a5553223bc91ccf25f290c087efc7a231b25",
    "site" : "https://github.com/login",
    "tokenPath" : "/oauth/access_token",
    "authorizationPath" : "/oauth/authorize"
};
var oauth2 = OAuth2Auth.create(vertx, 'AUTH_CODE', credentials);


router.route("/github").handler(function (c) {

    console.log('someone is connecting with github');

    var authorization_uri = oauth2.authorizeURL({
        "redirect_uri": "http://localhost:3000/callback/stage2",
        "scope": "user",
        "state": "testing123"
    });

    c.response().putHeader("Location", authorization_uri).setStatusCode(302).end();
});

router.route("/callback/stage2").handler(function (c) {

    var query = c.request().query();
    var vars = query.split('&');
    var code, state;

    for (var i = 0; i < vars.length; i++) {

        var pair = vars[i].split('=');
        var left = decodeURIComponent(pair[0]);
        var right = decodeURIComponent(pair[1]);
        console.log(' query ' + (i+1) + ': ' + left + ' ' + right);

        if (left == 'code') code = right;
        if (left == 'state') state = right;
    }

    var tokenConfig = {
        "code": code,
        "state": state,
        "redirect_uri": "http://localhost:3000/github/stage3"
    };

    oauth2.getToken(tokenConfig, function (res, res_err) {

        if (res_err != null) {
            console.error("Access Token Error: " + res_err.getMessage());
        } else {

            var token = res;
            console.log(' token received');
            console.log(token);
            console.log(JSON.stringify(token));

        }
    });

    c.response().putHeader("Location", "/github/stage3").setStatusCode(302).end();

});



router.route("/github/stage3").handler(function (c) {
    c.response().end("Welcome to stage 3");
});

// welcome page
router.get("/").handler(function (ctx) {
    ctx.response().putHeader("content-type", "text/html").end("Hello<br><a href=\"/github\">log in with Github</a>");
});

vertx.createHttpServer().requestHandler(router.accept).listen(3000, '0.0.0.0', function(res, res_err) {
    if (res_err) console.log('### deploying https server failed');
});
