/**
 * Created by YS on 2016-07-19.
 */
var credentials = require('../credentials');

function uploadImage(req, data, callback) {
    var formidable = require('formidable');
    var form = new formidable.IncomingForm();

    // 파일 폼 파싱 ##
    form.parse(req, function(err, fields, files) {
        if (err) {
            callback(false, "err");
        }

        console.log(files);
        console.log(fields);

        // S3 서버에 이미지 업로드 ##
        var AWS = require('aws-sdk');
        var fs = require('fs');
        var gm = require('gm').subClass({ imageMagick: true });
        var buffer = new Buffer(0);

        // Read in the file, convert it to base64, store to S3
        var fileStream = fs.createReadStream(files.content_img.path);
        fileStream.on('error', function (err) {
            if (err) {
                throw err;
            }
        });
        fileStream.on('data', function (data) {
            buffer = Buffer.concat([buffer, data]);
        });
        fileStream.on('end', function() {
            AWS.config.update({
                accessKeyId: credentials.aws.aws_access_key_id,
                secretAccessKey: credentials.aws.aws_secret_access_key,
                "region": "ap-northeast-2"
            });
            var s3 = new AWS.S3();

            // image name hashing
            var crypto = require('crypto');
            var salt = Math.round((new Date().valueOf() * Math.random())) + "";
            var image_name = crypto.createHash("sha256").update(files.content_img.name + salt).digest("hex");

            // bucket info & file info
            var bucketName = 'soma-bufy-storage';
            var keyName = 'images/'+image_name;

            s3.putObject({
                Bucket: bucketName,
                Key: keyName,
                Body: buffer
            }, function (err) {
                if (err) { throw err; }
                // Thubmnail image generate
                var smImage = new Buffer(0);
                gm(buffer)
                    .resize("300", "300")
                    .stream(function (err, stdout, stderr) {
                        stdout.on('data', function (data) {
                            smImage = Buffer.concat([smImage, data]);
                        });
                        stdout.on('end', function () {
                            var data = {
                                Bucket: bucketName,
                                Key: 'images/thumb/' + image_name,
                                Body: smImage
                            };
                            s3.putObject(data, function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                console.log('thumbnail generate done');
                            });
                        });
                    });
                // Rest API 사진정보 전송
                var dummy_data = {
                    image_url: keyName,
                    image_name: files.content_img.name,
                    author: data.user_id,
                    content_title: fields.content_title,
                    description: fields.description
                };

                callback(true, "업로드 완료", dummy_data);
                // TODO 저장하는 프로세스
                /*request.post({
                 url: credentials.api_server+'/cards/images',
                 form: form
                 }, function optionalCallback(err, httpResponse, body) {
                 if (err) {
                 return res.send(err);
                 }
                 var getObj = JSON.parse(body);

                 res.render('upload/upload_process', {
                 title: 'Result Page',
                 isLogin: req.session.isLogin,
                 isAdmin: req.session.isAdmin,
                 host: credentials.host_server,
                 msg: getObj.msg,
                 image_id: getObj.data,
                 img: req.query.img,
                 });
                 });*/
            });
        });
    });
}
module.exports = uploadImage;
