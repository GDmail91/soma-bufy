/**
 * Created by YS on 2016-07-22.
 */
var UAParser = require('ua-parser-js');

function ensureLatestBrowser(req, res, next) {

    var parser = new UAParser();
    var ua = req.headers['user-agent'];
    var browserName = parser.setUA(ua).getBrowser().name;
    var fullBrowserVersion = parser.setUA(ua).getBrowser().version;
    var browserVersion = fullBrowserVersion.split(".",1).toString();
    var browserVersionNumber = Number(browserVersion);

    console.log(browserName);

    if (browserName == 'IE')
        res.redirect('/redirect?origin='+req.originalUrl);
    else if (browserName == 'Firefox')
        res.redirect('/redirect?origin='+req.originalUrl);
    else if (browserName == 'Chrome')
        res.redirect('/redirect?origin='+req.originalUrl);
    else if (browserName == 'Canary')
        res.redirect('/redirect?origin='+req.originalUrl);
    else if (browserName == 'Safari')
        res.redirect('/redirect?origin='+req.originalUrl);
    else if (browserName == 'Opera')
        res.redirect('/redirect?origin='+req.originalUrl);
    else
        return next();
}

module.exports = ensureLatestBrowser;