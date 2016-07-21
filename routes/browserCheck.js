/**
 * Created by YS on 2016-07-22.
 */
var UAParser = require('ua-parser-js');

function ensureLatestBrowser(req, res, next) {
    console.log(req.header('user-agent'));

    var parser = new UAParser();
    var ua = req.headers['user-agent'];
    var browserName = parser.setUA(ua).getBrowser().name;
    var fullBrowserVersion = parser.setUA(ua).getBrowser().version;
    var browserVersion = fullBrowserVersion.split(".",1).toString();
    var browserVersionNumber = Number(browserVersion);

    console.log(browserName);
    console.log(browserVersion)

    if (browserName == 'IE')
        res.redirect('/redirect');
    else if (browserName == 'Firefox')
        res.redirect('/redirect');
    else if (browserName == 'Chrome')
        res.redirect('/redirect');
    else if (browserName == 'Canary')
        res.redirect('/redirect');
    else if (browserName == 'Safari')
        res.redirect('/redirect');
    else if (browserName == 'Opera')
        res.redirect('/redirect');
    else
        return next();
}

module.exports = ensureLatestBrowser;