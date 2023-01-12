var https = require("https");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var saml = require("passport-saml");
var fs = require("fs");

const PORT = 5000;
const BASE_URL ="https://localhost:5000"
const KEYCLOAK_BASE_URL ="http://localhost:8080"

/** SAML Configurations attributes
 * callbackurl : apps url for IDP to response post authetication
 * signout: apps url for IDP to notify app post signout
 * entrypoint: IDP url to redirect for authentication
 * entityId : Apps Id
 */
const samlConfig = {
  issuer: "kpi-saml-inbound-gateway",
  entityId: "KPI",
  callbackUrl: `${BASE_URL}/login/callback`,
  signOut: `${BASE_URL}/signout/callback`,
  entryPoint: `${KEYCLOAK_BASE_URL}/realms/KPI/protocol/saml`,
};

// For running apps on https mode
// load the public certificate
const sp_pub_cert = fs.readFileSync("sp-pub-cert.pem", "utf8");

//load the private key
const sp_pvk_key = fs.readFileSync("sp-pvt-key.pem", "utf8");

//Idp's certificate from metadata
const idp_cert = fs.readFileSync("idp-pub-key.pem", "utf8");

passport.serializeUser(function (user, done) {
  //Serialize user, console.log if needed
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  //Deserialize user, console.log if needed
  done(null, user);
});

// configure SAML strategy for SSO
const samlStrategy = new saml.Strategy(
  {
    callbackUrl: samlConfig.callbackUrl,
    entryPoint: samlConfig.entryPoint,
    issuer: samlConfig.issuer,
    identifierFormat: null,
    // decryptionPvk: sp_pvk_key,
    cert: [idp_cert, idp_cert],
    // privateCert: fs.readFileSync("sp-pvt-key.pem", "utf8"),
    validateInResponseTo: true,
    disableRequestedAuthnContext: true,
    additionalParams: {
      RelayState: "3baaa97f-31bb-420c-b0dc-f8340c2bc122", // Remove after testing
    },
  },
  (profile, done) => {
    console.log("passport.use() profile: %s \n", JSON.stringify(profile));
    return done(null, profile);
  }
);

//initialize the express middleware
const app = express();
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//configure session management
// Note: Always configure session before passport initialization & passport session, else error will be encounter
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

passport.use("samlStrategy", samlStrategy);
app.use(passport.initialize({}));
app.use(passport.session({}));

/** Configure routes **/
// default route
app.get("/", (req, res) => {
  res.send("Weclome to Single Sign-On Application in keycloak");
});

//login route
app.get(
  "/login",
  (req, res, next) => {
    //login handler starts
    next();
  },
  passport.authenticate("samlStrategy")
);

//post login callback route
app.post(
  "/login/callback",
  (req, res, next) => {
    console.log(req.user, "req.user");
    //login callback starts
    next();
  },
  passport.authenticate("samlStrategy"),
  (req, res) => {
    //SSO response payload
    console.log("RelayState : ", req.body.RelayState);
    console.log("Saml response Attributes :", req.user);
    console.log("Saml responsein XML :", req.user.getSamlResponseXml());
    res.send(req.user);
  }
);




// Run the https server
const server = https.createServer({
    'key': sp_pvk_key,
    'cert': sp_pub_cert
}, app).listen(PORT, () => {
    console.log('Listening on https://localhost:5000', server.address().port)
});

